package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.FingerprintScanRequest;
import com.bv87.diemdanh.dto.FingerprintScanResultDto;
import com.bv87.diemdanh.dto.KioskTemplateDto;
import com.bv87.diemdanh.entity.*;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.AttendanceRecordRepository;
import com.bv87.diemdanh.repository.EmployeeFingerprintRepository;
import com.bv87.diemdanh.repository.EmployeeRepository;
import com.bv87.diemdanh.repository.FingerprintScanLogRepository;
import com.bv87.diemdanh.security.KioskAuthentication;
import com.bv87.diemdanh.util.AttendanceValidity;
import com.bv87.diemdanh.util.CodeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.*;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * P2.1 kiosk Identify: serve templates + apply scan logs / rule C day-records.
 * P4b: server clock, debounce, unique-key upsert.
 */
@Service
@RequiredArgsConstructor
public class FingerprintScanService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalTime IN_START = LocalTime.of(5, 30);
    private static final LocalTime IN_END = LocalTime.of(11, 0);
    private static final LocalTime OUT_START = LocalTime.of(13, 30);
    private static final LocalTime OUT_END = LocalTime.of(18, 0);

    private static final Set<String> MANUAL_LOCK = Set.of(
            AttendanceStatus.NGHI_PHEP.name(),
            AttendanceStatus.DI_HOC.name(),
            AttendanceStatus.DI_CONG_TAC.name(),
            AttendanceStatus.THAI_SAN.name());

    private final EmployeeFingerprintRepository fingerprintRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final FingerprintScanLogRepository scanLogRepository;
    private final KioskScanDebouncer scanDebouncer;

    @Transactional(readOnly = true)
    public List<KioskTemplateDto> listTemplatesForKiosk(KioskAuthentication kiosk) {
        Integer deptCode = kiosk.getDeptCode();
        List<EmployeeFingerprint> fps = fingerprintRepository.findActiveByDeptCode(deptCode);
        if (fps.isEmpty()) {
            return List.of();
        }
        Map<Integer, Employee> empMap = employeeRepository.findByDeptCode(deptCode).stream()
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
        Integer deptCode = kiosk.getDeptCode();
        Employee emp = employeeRepository.findByEmpCodeWithDept(request.getEmpCode())
                .orElseThrow(() -> new BusinessException("Nhân viên không tồn tại"));
        if (!emp.isActive()) {
            throw new BusinessException("Nhân viên đã ngưng hoạt động");
        }
        if (!deptCode.equals(emp.getDepartment().getDeptCode())) {
            throw new AccessDeniedException("Nhân viên không thuộc đơn vị của kiosk");
        }
        if (!fingerprintRepository.existsByEmpCodeAndActiveTrue(emp.getEmpCode())) {
            throw new BusinessException("Nhân viên chưa đăng ký vân tay");
        }

        // SPEC §8.2 P4b — always server clock (ignore client scannedAt)
        Instant scannedAt = Instant.now();
        LocalDate day = scannedAt.atZone(ZONE).toLocalDate();

        if (scanDebouncer.isTooSoon(deptCode, emp.getEmpCode())) {
            return reject(emp, deptCode, scannedAt, request.getScore(), "Vừa ghi nhận — chờ giây lát.");
        }

        // SPEC §4.5 P5 — no reject for legacy report submissions
        LocalTime time = scannedAt.atZone(ZONE).toLocalTime();
        String direction = classifyDirection(time);

        AttendanceRecord existing = attendanceRecordRepository
                .findByDateAndEmpCode(day, emp.getEmpCode())
                .orElse(null);

        if (existing != null && existing.getStatus() != null && MANUAL_LOCK.contains(existing.getStatus())) {
            return reject(emp, deptCode, scannedAt, request.getScore(),
                    "Nhân viên đang được ghi " + labelOf(existing.getStatus()) + ". Không ghi nhận giờ từ vân tay.");
        }

        if ("REJECTED".equals(direction)) {
            return reject(emp, deptCode, scannedAt, request.getScore(), "Ngoài khung giờ vào/ra. Không ghi nhận.");
        }

        if ("IN".equals(direction)) {
            return applyIn(emp, deptCode, scannedAt, request.getScore(), existing, day);
        }
        return applyOut(emp, deptCode, scannedAt, request.getScore(), existing, day);
    }

    private FingerprintScanResultDto applyIn(
            Employee emp, Integer deptCode, Instant scannedAt, Integer score,
            AttendanceRecord existing, LocalDate day) {
        LocalTime time = scannedAt.atZone(ZONE).toLocalTime();
        AttendanceRecord record = existing != null ? existing : newAttendance(emp, day);
        Instant prevIn = record.getCheckInAt();
        String prevStatus = record.getStatus();

        applyRuleC(record, scannedAt, time, prevStatus, prevIn);
        record.setSource("FINGERPRINT");
        saveAttendanceSafe(record, day, emp.getEmpCode());
        saveLog(emp.getEmpCode(), deptCode, scannedAt, "IN", score, "Vào — " + record.getStatus());

        return result(emp, "IN", record.getStatus(), record.getCheckInAt(), record.getCheckOutAt(),
                score, "Đã ghi nhận vào (" + labelOf(record.getStatus()) + ").");
    }

    private void applyRuleC(
            AttendanceRecord record, Instant scannedAt, LocalTime time, String prevStatus, Instant prevIn) {
        LocalTime cutoff = AttendanceValidity.LATE_CUTOFF;
        if (!time.isAfter(cutoff)) {
            Instant onTimeMax = scannedAt;
            if (prevIn != null && !prevIn.atZone(ZONE).toLocalTime().isAfter(cutoff)) {
                onTimeMax = scannedAt.isAfter(prevIn) ? scannedAt : prevIn;
            }
            record.setCheckInAt(onTimeMax);
            record.setStatus(AttendanceStatus.DI_LAM.name());
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
            record.setCheckInAt(scannedAt);
            record.setStatus(AttendanceStatus.DI_TRE.name());
        }
    }

    private FingerprintScanResultDto applyOut(
            Employee emp, Integer deptCode, Instant scannedAt, Integer score,
            AttendanceRecord existing, LocalDate day) {
        // SPEC §4.4 A — OUT without day-record: create row with check_out only, status null
        AttendanceRecord record = existing != null ? existing : newOutOnlyAttendance(emp, day);
        boolean outOnly = record.getStatus() == null && record.getCheckInAt() == null;

        Instant prevOut = record.getCheckOutAt();
        if (prevOut == null || scannedAt.isAfter(prevOut)) {
            record.setCheckOutAt(scannedAt);
        }
        if (!StringUtils.hasText(record.getSource())) {
            record.setSource("FINGERPRINT");
        }
        saveAttendanceSafe(record, day, emp.getEmpCode());

        String logMsg = outOnly ? "Ra về (chưa có giờ vào)" : "Ra về";
        String apiMsg = outOnly
                ? "Đã ghi nhận ra (chưa có giờ vào trong ngày)."
                : "Đã ghi nhận ra.";
        saveLog(emp.getEmpCode(), deptCode, scannedAt, "OUT", score, logMsg);
        return result(emp, "OUT", record.getStatus(), record.getCheckInAt(), record.getCheckOutAt(),
                score, apiMsg);
    }

    /**
     * SPEC §8.2 — on unique (date, emp) race, reload and merge fields then save again.
     */
    private void saveAttendanceSafe(AttendanceRecord record, LocalDate day, Integer empCode) {
        try {
            attendanceRecordRepository.saveAndFlush(record);
        } catch (DataIntegrityViolationException ex) {
            AttendanceRecord existing = attendanceRecordRepository
                    .findByDateAndEmpCode(day, empCode)
                    .orElseThrow(() -> ex);
            if (record.getCheckInAt() != null) {
                Instant prevIn = existing.getCheckInAt();
                if (prevIn == null || record.getCheckInAt().isBefore(prevIn)
                        || (existing.getStatus() == null && record.getStatus() != null)) {
                    existing.setCheckInAt(record.getCheckInAt());
                }
                if (StringUtils.hasText(record.getStatus())) {
                    // Prefer DI_LAM over DI_TRE if both raced
                    if (AttendanceStatus.DI_LAM.name().equals(record.getStatus())
                            || existing.getStatus() == null) {
                        existing.setStatus(record.getStatus());
                    }
                }
            }
            if (record.getCheckOutAt() != null) {
                Instant prevOut = existing.getCheckOutAt();
                if (prevOut == null || record.getCheckOutAt().isAfter(prevOut)) {
                    existing.setCheckOutAt(record.getCheckOutAt());
                }
            }
            if (StringUtils.hasText(record.getSource())) {
                existing.setSource(record.getSource());
            }
            attendanceRecordRepository.save(existing);
            record.setId(existing.getId());
            record.setCheckInAt(existing.getCheckInAt());
            record.setCheckOutAt(existing.getCheckOutAt());
            record.setStatus(existing.getStatus());
            record.setSource(existing.getSource());
        }
    }

    /** Day-record for OUT-first scan — status stays null (CHƯA CHẤM) until IN or HEAD assigns. */
    private AttendanceRecord newOutOnlyAttendance(Employee emp, LocalDate day) {
        AttendanceRecord r = new AttendanceRecord();
        r.setEmployee(emp);
        r.setAttendanceDate(day);
        r.setStatus(null);
        return r;
    }

    private AttendanceRecord newAttendance(Employee emp, LocalDate day) {
        AttendanceRecord r = new AttendanceRecord();
        r.setEmployee(emp);
        r.setAttendanceDate(day);
        r.setStatus(AttendanceStatus.DI_LAM.name());
        return r;
    }

    private FingerprintScanResultDto reject(
            Employee emp, Integer deptCode, Instant scannedAt, Integer score, String message) {
        saveLog(emp.getEmpCode(), deptCode, scannedAt, "REJECTED", score, message);
        return result(emp, "REJECTED", null, null, null, score, message);
    }

    private void saveLog(Integer empCode, Integer deptCode, Instant scannedAt,
                         String direction, Integer score, String message) {
        FingerprintScanLog log = new FingerprintScanLog();
        log.setEmpCode(empCode);
        log.setDeptCode(deptCode);
        log.setScannedAt(scannedAt);
        log.setDirection(direction);
        log.setScore(score);
        log.setMessage(message);
        log.setCreatedAt(Instant.now());
        scanLogRepository.save(log);
    }

    private static String classifyDirection(LocalTime time) {
        if (!time.isBefore(IN_START) && !time.isAfter(IN_END)) {
            return "IN";
        }
        if (!time.isBefore(OUT_START) && !time.isAfter(OUT_END)) {
            return "OUT";
        }
        return "REJECTED";
    }

    private static String labelOf(String status) {
        try {
            return AttendanceStatus.valueOf(status).getLabel();
        } catch (Exception e) {
            return status;
        }
    }

    private static FingerprintScanResultDto result(
            Employee emp, String direction, String status,
            Instant checkIn, Instant checkOut, Integer score, String message) {
        return FingerprintScanResultDto.builder()
                .empCode(emp.getEmpCode())
                .empCodeFormatted(CodeFormatter.formatEmpCode(emp.getEmpCode()))
                .fullname(emp.getFullname())
                .direction(direction)
                .status(status)
                .checkInAt(checkIn)
                .checkOutAt(checkOut)
                .score(score)
                .message(message)
                .build();
    }
}
