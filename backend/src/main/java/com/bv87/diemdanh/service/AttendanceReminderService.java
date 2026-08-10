package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.AttendanceSummaryDto;
import com.bv87.diemdanh.dto.MissingPunchItemDto;
import com.bv87.diemdanh.dto.MissingPunchesResponseDto;
import com.bv87.diemdanh.dto.ReminderDeptStatDto;
import com.bv87.diemdanh.dto.ReminderHistoryDto;
import com.bv87.diemdanh.dto.ReminderHistoryItemDto;
import com.bv87.diemdanh.dto.SendReminderResultDto;
import com.bv87.diemdanh.entity.*;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.AccountRepository;
import com.bv87.diemdanh.repository.AttendanceReminderLogRepository;
import com.bv87.diemdanh.repository.DepartmentRepository;
import org.springframework.data.domain.Pageable;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.util.VietnamTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceReminderService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final AttendanceService attendanceService;
    private final AccountRepository accountRepository;
    private final NotificationService notificationService;
    private final AttendanceReminderLogRepository reminderLogRepository;
    private final DepartmentRepository departmentRepository;
    private final SettingsService settingsService;
    private final VietnamTimeService timeService;

    @Transactional
    public SendReminderResultDto sendManualReminders(AuthUser authUser, List<Integer> deptCodes) {
        // Default target = yesterday (P5 missing-punch model)
        return sendManualReminders(authUser, deptCodes, timeService.today().minusDays(1));
    }

    /**
     * Manual reminders for departments with missing punches on {@code attendanceDate}.
     *
     * @param attendanceDate day the missing-punch queue refers to (usually D−1)
     */
    @Transactional
    public SendReminderResultDto sendManualReminders(
            AuthUser authUser, List<Integer> deptCodes, LocalDate attendanceDate) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới được gửi nhắc nhở");
        }
        if (deptCodes == null || deptCodes.isEmpty()) {
            throw new BusinessException("Chọn ít nhất một Đơn vị");
        }
        if (attendanceDate == null) {
            throw new BusinessException("Thiếu ngày Chấm công để nhắc nhở");
        }
        return dispatchReminders(attendanceDate, deptCodes, ReminderTriggerType.MANUAL, authUser);
    }

    @Transactional
    public void sendAutoRemindersIfDue() {
        LocalDate today = timeService.today();
        if (reminderLogRepository.existsByAttendanceDateAndTriggerType(today, ReminderTriggerType.AUTO)) {
            return;
        }
        if (!timeService.isReminderMinute()) {
            return;
        }
        // P5 — remind about yesterday's missing punches (not today's incomplete submit)
        LocalDate targetDate = today.minusDays(1);
        MissingPunchesResponseDto missing = attendanceService.listMissingPunchesForSystem(targetDate);
        List<Integer> incompleteDeptCodes = missing.getItems().stream()
                .map(MissingPunchItemDto::getDeptCode)
                .distinct()
                .toList();
        if (incompleteDeptCodes.isEmpty()) {
            reminderLogRepository.save(buildAutoMarkerLog(today,
                    "Không có ĐƠN VỊ thiếu dữ liệu chấm công ngày " + targetDate.format(DATE_FMT) + "."));
            return;
        }
        dispatchReminders(targetDate, incompleteDeptCodes, ReminderTriggerType.AUTO, null);
    }

    private AttendanceReminderLog buildAutoMarkerLog(LocalDate date, String message) {
        AttendanceReminderLog log = new AttendanceReminderLog();
        log.setAttendanceDate(date);
        log.setDeptCode(0);
        log.setTriggerType(ReminderTriggerType.AUTO);
        log.setStatus(ReminderLogStatus.SENT);
        log.setMessage(message);
        return log;
    }

    private SendReminderResultDto dispatchReminders(
            LocalDate date,
            List<Integer> requestedDeptCodes,
            ReminderTriggerType trigger,
            AuthUser admin) {
        List<AttendanceSummaryDto> summaries = attendanceService.getAllSummariesForSystem(date);
        Map<Integer, AttendanceSummaryDto> summaryMap = summaries.stream()
                .collect(Collectors.toMap(AttendanceSummaryDto::getDeptCode, s -> s));

        // P5 — gate on missing-punch queue, not CompletionStatus.COMPLETED
        MissingPunchesResponseDto missing = attendanceService.listMissingPunchesForSystem(date);
        Map<Integer, Long> missingCountByDept = missing.getItems().stream()
                .collect(Collectors.groupingBy(MissingPunchItemDto::getDeptCode, Collectors.counting()));

        String reminderTime = settingsService.getResolvedReminderTime();
        int sent = 0;
        int skippedNoHead = 0;
        List<String> skippedNames = new ArrayList<>();
        List<String> sentNames = new ArrayList<>();
        Long adminId = admin != null ? admin.getAccount().getId() : null;

        for (Integer deptCode : requestedDeptCodes) {
            AttendanceSummaryDto summary = summaryMap.get(deptCode);
            if (summary == null) {
                continue;
            }
            long missingCount = missingCountByDept.getOrDefault(deptCode, 0L);
            if (missingCount <= 0) {
                continue;
            }

            List<Account> heads = accountRepository.findAllActiveByRoleAndDeptCode(AccountRole.HEAD, deptCode);
            if (heads.isEmpty()) {
                skippedNoHead++;
                skippedNames.add(summary.getDeptName());
                saveLog(date, deptCode, trigger, null, adminId, ReminderLogStatus.SKIPPED_NO_HEAD,
                        "Thiếu tài khoản HEAD cho " + summary.getDeptName());
                continue;
            }

            Account head = heads.get(0);
            String body = buildReminderBody(summary, date, reminderTime, missingCount);
            Notification notification = new Notification();
            notification.setRecipientId(head.getId());
            notification.setSenderId(adminId);
            notification.setType(NotificationType.ATTENDANCE_REMINDER);
            notification.setTitle("Nhắc thiếu dữ liệu Chấm công");
            notification.setBody(body);
            notification.setDeptCode(deptCode);
            notification.setAttendanceDate(date);
            notificationService.save(notification);

            sent++;
            sentNames.add(summary.getDeptName());
            saveLog(date, deptCode, trigger, head.getId(), adminId, ReminderLogStatus.SENT, body);
        }

        notifyAdmins(date, trigger, adminId, sent, skippedNoHead, skippedNames, sentNames);

        String message = buildAdminResultMessage(sent, skippedNoHead, skippedNames, sentNames);
        return SendReminderResultDto.builder()
                .sent(sent)
                .skippedNoHead(skippedNoHead)
                .message(message)
                .skippedDeptNames(skippedNames)
                .build();
    }

    private void notifyAdmins(
            LocalDate date,
            ReminderTriggerType trigger,
            Long senderId,
            int sent,
            int skippedNoHead,
            List<String> skippedNames,
            List<String> sentNames) {
        String body = buildAdminResultMessage(sent, skippedNoHead, skippedNames, sentNames);
        String title = trigger == ReminderTriggerType.AUTO
                ? "Tự động gửi nhắc nhở"
                : "Kết quả gửi nhắc nhở";

        List<Account> admins = accountRepository.findAllActiveByRole(AccountRole.ADMIN);
        for (Account adminAccount : admins) {
            Notification n = new Notification();
            n.setRecipientId(adminAccount.getId());
            n.setSenderId(senderId);
            n.setType(NotificationType.ADMIN_REMINDER_RESULT);
            n.setTitle(title);
            n.setBody(body);
            n.setAttendanceDate(date);
            notificationService.save(n);
        }
    }

    private String buildReminderBody(
            AttendanceSummaryDto summary, LocalDate date, String reminderTime, long missingCount) {
        return summary.getDeptName()
                + " ngày " + date.format(DATE_FMT)
                + " còn " + missingCount + " trường hợp thiếu giờ ra / chưa chấm"
                + " (" + summary.getMarkedCount() + "/" + summary.getTotal()
                + " đã có trạng thái). Vui lòng rà soát thiếu giờ ra hoặc gán ngoại lệ."
                + " (Nhắc lúc " + reminderTime + ")";
    }

    @Transactional(readOnly = true)
    public ReminderHistoryDto getReminderHistory(AuthUser authUser, LocalDate from, LocalDate to) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới được xem lịch sử nhắc nhở");
        }

        LocalDate today = timeService.today();
        LocalDate resolvedFrom = from != null ? from : today.withDayOfMonth(1);
        LocalDate resolvedTo = to != null ? to : today;
        if (resolvedFrom.isAfter(resolvedTo)) {
            throw new BusinessException("Từ ngày không được lớn hơn đến ngày");
        }

        List<Department> departments = departmentRepository.findAll().stream()
                .filter(Department::isActive)
                .sorted(java.util.Comparator.comparing(Department::getDeptCode))
                .toList();

        Map<Integer, String> deptNames = departments.stream()
                .collect(Collectors.toMap(Department::getDeptCode, Department::getDeptName));

        List<ReminderHistoryItemDto> history = reminderLogRepository
                .findByDeptCodeGreaterThanAndAttendanceDateBetweenAndStatusOrderByCreatedAtDesc(
                        0, resolvedFrom, resolvedTo, ReminderLogStatus.SENT, Pageable.ofSize(200))
                .stream()
                .map(log -> ReminderHistoryItemDto.builder()
                        .id(log.getId())
                        .attendanceDate(log.getAttendanceDate())
                        .deptCode(log.getDeptCode())
                        .deptName(deptNames.getOrDefault(log.getDeptCode(), "Mã " + log.getDeptCode()))
                        .triggerType(log.getTriggerType().name())
                        .status(log.getStatus().name())
                        .createdAt(log.getCreatedAt())
                        .build())
                .toList();

        Map<Integer, Long> countMap = reminderLogRepository.countSentByDeptBetween(resolvedFrom, resolvedTo)
                .stream()
                .collect(Collectors.toMap(
                        row -> (Integer) row[0],
                        row -> (Long) row[1]));

        List<ReminderDeptStatDto> stats = departments.stream()
                .map(dept -> ReminderDeptStatDto.builder()
                        .deptCode(dept.getDeptCode())
                        .deptName(dept.getDeptName())
                        .sentCount(countMap.getOrDefault(dept.getDeptCode(), 0L).intValue())
                        .build())
                .sorted(java.util.Comparator
                        .comparingInt(ReminderDeptStatDto::getSentCount).reversed()
                        .thenComparing(ReminderDeptStatDto::getDeptName))
                .toList();

        return ReminderHistoryDto.builder()
                .history(history)
                .stats(stats)
                .build();
    }

    private String buildAdminResultMessage(
            int sent,
            int skippedNoHead,
            List<String> skippedNames,
            List<String> sentNames) {
        if (sent == 0 && skippedNoHead == 0) {
            return "Không có ĐƠN VỊ nào còn thiếu dữ liệu chấm công để gửi nhắc nhở.";
        }
        StringBuilder sb = new StringBuilder();
        if (sent > 0) {
            if (sent == 1 && sentNames.size() == 1) {
                sb.append("Đã gửi nhắc nhở tới ").append(sentNames.get(0)).append('.');
            } else {
                sb.append("Đã gửi nhắc nhở tới ").append(sent)
                        .append(" ĐƠN VỊ: ")
                        .append(String.join(", ", sentNames))
                        .append('.');
            }
        }
        if (skippedNoHead > 0) {
            if (!sb.isEmpty()) {
                sb.append(' ');
            }
            sb.append("Bỏ qua ").append(skippedNoHead)
                    .append(" đơn vị vì chưa có tài khoản đăng nhập Trưởng phòng: ")
                    .append(String.join(", ", skippedNames))
                    .append(". Vui lòng thêm tại Cài đặt → Phân quyền người dùng.");
        }
        return sb.toString();
    }

    private void saveLog(
            LocalDate date,
            Integer deptCode,
            ReminderTriggerType trigger,
            Long headId,
            Long adminId,
            ReminderLogStatus status,
            String message) {
        AttendanceReminderLog log = new AttendanceReminderLog();
        log.setAttendanceDate(date);
        log.setDeptCode(deptCode);
        log.setTriggerType(trigger);
        log.setHeadAccountId(headId);
        log.setAdminId(adminId);
        log.setStatus(status);
        log.setMessage(message);
        reminderLogRepository.save(log);
    }
}
