package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.FingerprintScanRequest;
import com.bv87.diemdanh.dto.FingerprintScanResultDto;
import com.bv87.diemdanh.dto.KioskTemplateDto;
import com.bv87.diemdanh.entity.*;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.AttendanceRecordRepository;
import com.bv87.diemdanh.repository.EmployeeFingerprintRepository;
import com.bv87.diemdanh.repository.EmployeeRepository;
import com.bv87.diemdanh.repository.FingerprintScanLogRepository;
import com.bv87.diemdanh.security.KioskAuthentication;
import com.bv87.diemdanh.util.AttendanceValidity;
import com.bv87.diemdanh.util.CodeFormatter;
import com.bv87.diemdanh.util.WorkSchedule;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * P2.1 / P7 kiosk Identify: 4-phase windows from settings + rule C + late_flag.
 */
@Service
@RequiredArgsConstructor
public class FingerprintScanService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final EmployeeFingerprintRepository fingerprintRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final FingerprintScanLogRepository scanLogRepository;
    private final KioskScanDebouncer scanDebouncer;
    private final WorkScheduleService workScheduleService;

    @Transactional(readOnly = true)
    public List<KioskTemplateDto> listTemplatesForKiosk(KioskAuthentication kiosk) {
        List<EmployeeFingerprint> fps = fingerprintRepository.findActiveForActiveEmployees();
        if (fps.isEmpty()) {
            return List.of();
        }
        List<Integer> empCodes = fps.stream().map(EmployeeFingerprint::getEmpCode).distinct().toList();
        Map<Integer, Employee> empMap = employeeRepository.findByEmpCodeIn(empCodes).stream()
                .collect(Collectors.toMap(Employee::getEmpCode, e -> e, (a, b) -> a));
        return fps.stream()
                .map(fp -> {
                    Employee emp = empMap.get(fp.getEmpCode());
                    String name = emp != null ? emp.getFullname() : "";
                    return KioskTemplateDto.builder()
                            .empCode(fp.getEmpCode())
                            .empCodeFormatted(CodeFormatter.formatEmpCode(fp.getEmpCode()))
                            .fullname(name)
                            .zkFid(fp.getEmpCode())
                            .templateBase64(fp.getTemplateBase64())
                            .templateLen(fp.getTemplateLen())
                            .build();
                })
                .toList();
    }

    @Transactional
    public FingerprintScanResultDto processScan(KioskAuthentication kiosk, FingerprintScanRequest request) {
        Integer kioskDeptCode = kiosk.getDeptCode();
        String kioskLabel = kiosk.getLabel();
        Employee emp = employeeRepository.findByEmpCodeWithDept(request.getEmpCode())
                .orElseThrow(() -> new BusinessException("Nhân viên không tồn tại"));
        if (!emp.isActive()) {
            throw new BusinessException("Nhân viên đã ngưng hoạt động");
        }
        if (!fingerprintRepository.existsByEmpCodeAndActiveTrue(emp.getEmpCode())) {
            throw new BusinessException("Nhân viên chưa đăng ký vân tay");
        }

        Instant scannedAt = Instant.now();
        LocalDate day = scannedAt.atZone(ZONE).toLocalDate();
        ScanContext ctx = new ScanContext(
                request.getClientHostname(), request.getClientIp(), kioskLabel, kioskDeptCode);

        if (scanDebouncer.isTooSoon(emp.getEmpCode())) {
            return reject(emp, ctx, scannedAt, request.getScore(), "Vừa ghi nhận — chờ giây lát.");
        }

        WorkSchedule schedule = workScheduleService.current();
        LocalTime time = scannedAt.atZone(ZONE).toLocalTime();
        WorkSchedule.PunchPhase phase = schedule.classify(time);
        String direction = phase.name();

        AttendanceRecord existing = attendanceRecordRepository
                .findByDateAndEmpCode(day, emp.getEmpCode())
                .orElse(null);

        if (existing != null
                && AttendanceValidity.isManualStatus(existing.getStatus())
                && !AttendanceValidity.isHybridKeepTimes(existing.getStatus())) {
            return reject(emp, ctx, scannedAt, request.getScore(),
                    "Nhân viên đang được ghi " + labelOf(existing.getStatus()) + ". Không ghi nhận giờ từ vân tay.");
        }

        if (phase == WorkSchedule.PunchPhase.REJECTED) {
            return reject(emp, ctx, scannedAt, request.getScore(), "Ngoài khung giờ vào/ra. Không ghi nhận.");
        }

        return applyPhase(emp, ctx, scannedAt, request.getScore(), existing, day, phase, schedule);
    }

    private FingerprintScanResultDto applyPhase(
            Employee emp, ScanContext ctx, Instant scannedAt, Integer score,
            AttendanceRecord existing, LocalDate day,
            WorkSchedule.PunchPhase phase, WorkSchedule schedule) {
        AttendanceRecord record = existing != null ? existing : newBlankAttendance(emp, day);
        LocalTime time = scannedAt.atZone(ZONE).toLocalTime();

        switch (phase) {
            case MORNING_IN -> applyMorningIn(record, scannedAt, time, schedule);
            case NOON_OUT -> record.setNoonOutAt(maxInstant(record.getNoonOutAt(), scannedAt));
            case AFTERNOON_IN -> {
                if (record.getAfternoonInAt() == null) {
                    record.setAfternoonInAt(scannedAt);
                }
            }
            case AFTERNOON_OUT -> record.setAfternoonOutAt(maxInstant(record.getAfternoonOutAt(), scannedAt));
            default -> {
            }
        }

        refreshPresenceStatus(record, schedule);
        stampKiosk(record, ctx);
        record.setSource(AttendanceValidity.sourceAfterFingerprintScan(record.getSource()));
        AttendanceValidity.syncLegacyTimes(record);
        saveAttendanceSafe(record, day, emp.getEmpCode());
        saveLog(emp.getEmpCode(), ctx, scannedAt, phase.name(), score, messageFor(phase, record));

        return result(emp, phase.name(), record, score, apiMessageFor(phase, record));
    }

    private void applyMorningIn(AttendanceRecord record, Instant scannedAt, LocalTime time, WorkSchedule schedule) {
        LocalTime cutoff = schedule.lateCutoff();
        Instant prevIn = record.getMorningInAt();
        String prevStatus = record.getStatus();
        if (!time.isAfter(cutoff)) {
            Instant onTimeMax = scannedAt;
            if (prevIn != null && !prevIn.atZone(ZONE).toLocalTime().isAfter(cutoff)) {
                onTimeMax = scannedAt.isAfter(prevIn) ? scannedAt : prevIn;
            }
            record.setMorningInAt(onTimeMax);
            if (!AttendanceValidity.isManualStatus(prevStatus)) {
                record.setStatus(AttendanceStatus.DI_LAM.name());
            }
            return;
        }
        boolean alreadyOnTimeDiLam = prevIn != null
                && !prevIn.atZone(ZONE).toLocalTime().isAfter(cutoff)
                && AttendanceStatus.DI_LAM.name().equals(prevStatus);
        if (alreadyOnTimeDiLam) {
            return;
        }
        if (AttendanceStatus.DI_TRE.name().equals(prevStatus) && prevIn != null) {
            return;
        }
        if (prevIn == null) {
            record.setMorningInAt(scannedAt);
            if (!AttendanceValidity.isManualStatus(prevStatus)) {
                record.setStatus(AttendanceStatus.DI_TRE.name());
            }
        }
    }

    private void refreshPresenceStatus(AttendanceRecord record, WorkSchedule schedule) {
        if (AttendanceValidity.NGHI_TRUC_HALF.equals(record.getStatus())) {
            return;
        }
        if (AttendanceValidity.isManualStatus(record.getStatus())
                && !AttendanceValidity.VE_SOM.equals(record.getStatus())
                && !AttendanceValidity.isPresenceStatus(record.getStatus())) {
            return;
        }
        if (AttendanceValidity.punchCount(record) < 4) {
            if (record.getMorningInAt() != null && !AttendanceValidity.isManualStatus(record.getStatus())) {
                LocalTime inTime = record.getMorningInAt().atZone(ZONE).toLocalTime();
                record.setStatus(AttendanceValidity.statusFromCheckInTime(inTime, schedule.lateCutoff()));
                record.setLateFlag(schedule.isLate(inTime));
            }
            return;
        }
        LocalTime morning = record.getMorningInAt().atZone(ZONE).toLocalTime();
        LocalTime afternoonOut = record.getAfternoonOutAt().atZone(ZONE).toLocalTime();
        boolean late = schedule.isLate(morning);
        record.setLateFlag(late);
        if (schedule.isEarlyLeave(afternoonOut)) {
            AttendanceValidity.applyClockStatus(record, AttendanceValidity.VE_SOM);
            return;
        }
        AttendanceValidity.applyClockStatus(record, late
                ? AttendanceStatus.DI_TRE.name()
                : AttendanceStatus.DI_LAM.name());
    }

    private void stampKiosk(AttendanceRecord record, ScanContext ctx) {
        record.setLastKioskHostname(trimToNull(ctx.hostname()));
        record.setLastKioskIp(trimToNull(ctx.ip()));
        record.setLastKioskDeptCode(ctx.deptCode());
        record.setLastKioskLabel(trimToNull(ctx.label()));
    }

    private void saveAttendanceSafe(AttendanceRecord record, LocalDate day, Integer empCode) {
        try {
            attendanceRecordRepository.saveAndFlush(record);
        } catch (DataIntegrityViolationException ex) {
            AttendanceRecord existing = attendanceRecordRepository
                    .findByDateAndEmpCode(day, empCode)
                    .orElseThrow(() -> ex);
            mergeFourPunches(existing, record);
            if (StringUtils.hasText(record.getStatus()) && existing.getStatus() == null) {
                existing.setStatus(record.getStatus());
            }
            if (StringUtils.hasText(record.getSource())) {
                existing.setSource(record.getSource());
            }
            existing.setLateFlag(existing.isLateFlag() || record.isLateFlag());
            stampKiosk(existing, new ScanContext(
                    record.getLastKioskHostname(), record.getLastKioskIp(),
                    record.getLastKioskLabel(), record.getLastKioskDeptCode()));
            AttendanceValidity.syncLegacyTimes(existing);
            attendanceRecordRepository.save(existing);
            record.setId(existing.getId());
            record.setMorningInAt(existing.getMorningInAt());
            record.setNoonOutAt(existing.getNoonOutAt());
            record.setAfternoonInAt(existing.getAfternoonInAt());
            record.setAfternoonOutAt(existing.getAfternoonOutAt());
            record.setStatus(existing.getStatus());
            record.setSource(existing.getSource());
            record.setLateFlag(existing.isLateFlag());
            AttendanceValidity.syncLegacyTimes(record);
        }
    }

    private static void mergeFourPunches(AttendanceRecord existing, AttendanceRecord incoming) {
        if (incoming.getMorningInAt() != null && existing.getMorningInAt() == null) {
            existing.setMorningInAt(incoming.getMorningInAt());
        }
        if (incoming.getNoonOutAt() != null) {
            existing.setNoonOutAt(maxInstant(existing.getNoonOutAt(), incoming.getNoonOutAt()));
        }
        if (incoming.getAfternoonInAt() != null && existing.getAfternoonInAt() == null) {
            existing.setAfternoonInAt(incoming.getAfternoonInAt());
        }
        if (incoming.getAfternoonOutAt() != null) {
            existing.setAfternoonOutAt(maxInstant(existing.getAfternoonOutAt(), incoming.getAfternoonOutAt()));
        }
    }

    private AttendanceRecord newBlankAttendance(Employee emp, LocalDate day) {
        AttendanceRecord r = new AttendanceRecord();
        r.setEmployee(emp);
        r.setAttendanceDate(day);
        r.setStatus(null);
        return r;
    }

    private FingerprintScanResultDto reject(
            Employee emp, ScanContext ctx, Instant scannedAt, Integer score, String message) {
        saveLog(emp.getEmpCode(), ctx, scannedAt, "REJECTED", score, message);
        return result(emp, "REJECTED", null, score, message);
    }

    private void saveLog(Integer empCode, ScanContext ctx, Instant scannedAt,
                         String direction, Integer score, String message) {
        FingerprintScanLog log = new FingerprintScanLog();
        log.setEmpCode(empCode);
        log.setDeptCode(ctx.deptCode());
        log.setScannedAt(scannedAt);
        log.setDirection(direction);
        log.setScore(score);
        log.setMessage(message);
        log.setClientHostname(trimToNull(ctx.hostname()));
        log.setClientIp(trimToNull(ctx.ip()));
        log.setKioskLabel(trimToNull(ctx.label()));
        log.setCreatedAt(Instant.now());
        scanLogRepository.save(log);
    }

    private static Instant maxInstant(Instant current, Instant candidate) {
        if (candidate == null) {
            return current;
        }
        if (current == null || candidate.isAfter(current)) {
            return candidate;
        }
        return current;
    }

    private static String messageFor(WorkSchedule.PunchPhase phase, AttendanceRecord record) {
        return switch (phase) {
            case MORNING_IN -> "Vào sáng — " + labelOf(record.getStatus());
            case NOON_OUT -> "Ra trưa";
            case AFTERNOON_IN -> "Vào chiều";
            case AFTERNOON_OUT -> AttendanceValidity.VE_SOM.equals(record.getStatus())
                    ? "Ra chiều — Về sớm"
                    : "Ra chiều";
            default -> phase.name();
        };
    }

    private static String apiMessageFor(WorkSchedule.PunchPhase phase, AttendanceRecord record) {
        return switch (phase) {
            case MORNING_IN -> "Đã ghi nhận vào sáng (" + labelOf(record.getStatus()) + ").";
            case NOON_OUT -> "Đã ghi nhận ra trưa.";
            case AFTERNOON_IN -> "Đã ghi nhận vào chiều.";
            case AFTERNOON_OUT -> AttendanceValidity.VE_SOM.equals(record.getStatus())
                    ? "Đã ghi nhận ra chiều (về sớm). Trưởng đơn vị cần nhập lý do."
                    : "Đã ghi nhận ra chiều.";
            default -> "Đã ghi nhận.";
        };
    }

    private static String labelOf(String status) {
        if (status == null) {
            return "Chưa chấm";
        }
        try {
            return AttendanceStatus.valueOf(status).getLabel();
        } catch (Exception e) {
            return status;
        }
    }

    private static String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private static FingerprintScanResultDto result(
            Employee emp, String direction, AttendanceRecord record, Integer score, String message) {
        return FingerprintScanResultDto.builder()
                .empCode(emp.getEmpCode())
                .empCodeFormatted(CodeFormatter.formatEmpCode(emp.getEmpCode()))
                .fullname(emp.getFullname())
                .direction(direction)
                .status(record != null ? record.getStatus() : null)
                .checkInAt(record != null ? record.getCheckInAt() : null)
                .checkOutAt(record != null ? record.getCheckOutAt() : null)
                .score(score)
                .message(message)
                .build();
    }

    private record ScanContext(String hostname, String ip, String label, Integer deptCode) {
    }
}
