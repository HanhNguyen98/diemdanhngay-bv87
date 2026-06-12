package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.AttendanceSummaryDto;
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
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới được gửi nhắc nhở");
        }
        if (deptCodes == null || deptCodes.isEmpty()) {
            throw new BusinessException("Chọn ít nhất một Đơn vị");
        }
        return dispatchReminders(timeService.today(), deptCodes, ReminderTriggerType.MANUAL, authUser);
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
        List<AttendanceSummaryDto> summaries = attendanceService.getAllSummariesForSystem(today);
        List<Integer> incompleteDeptCodes = summaries.stream()
                .filter(s -> s.getCompletionStatus() == CompletionStatus.INCOMPLETE)
                .map(AttendanceSummaryDto::getDeptCode)
                .toList();
        if (incompleteDeptCodes.isEmpty()) {
            reminderLogRepository.save(buildAutoMarkerLog(today, "Không có ĐƠN VỊ chưa hoàn thành."));
            return;
        }
        dispatchReminders(today, incompleteDeptCodes, ReminderTriggerType.AUTO, null);
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
            if (summary.getCompletionStatus() == CompletionStatus.COMPLETED) {
                continue;
            }

            var headOpt = accountRepository.findActiveByRoleAndDeptCode(AccountRole.HEAD, deptCode);
            if (headOpt.isEmpty()) {
                skippedNoHead++;
                skippedNames.add(summary.getDeptName());
                saveLog(date, deptCode, trigger, null, adminId, ReminderLogStatus.SKIPPED_NO_HEAD,
                        "Thiếu tài khoản HEAD cho " + summary.getDeptName());
                continue;
            }

            Account head = headOpt.get();
            String body = buildReminderBody(summary, date, reminderTime);
            Notification notification = new Notification();
            notification.setRecipientId(head.getId());
            notification.setSenderId(adminId);
            notification.setType(NotificationType.ATTENDANCE_REMINDER);
            notification.setTitle("Nhắc hoàn thành chấm công");
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

    private String buildReminderBody(AttendanceSummaryDto summary, LocalDate date, String reminderTime) {
        return summary.getDeptName()
                + " ngày " + date.format(DATE_FMT)
                + " (" + summary.getMarkedCount() + "/" + summary.getTotal() + ", chưa xong). "
                + "Hoàn thành trước " + reminderTime + ".";
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
            return "Không có ĐƠN VỊ chưa hoàn thành để gửi nhắc nhở.";
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
                    .append(" phòng thiếu tài khoản HEAD — vui lòng thêm tài khoản trưởng ban: ")
                    .append(String.join(", ", skippedNames))
                    .append('.');
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
