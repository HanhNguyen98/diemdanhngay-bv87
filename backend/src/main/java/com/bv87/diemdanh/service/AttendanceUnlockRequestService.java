package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.UnlockRequestCreateRequest;
import com.bv87.diemdanh.dto.UnlockRequestItemDto;
import com.bv87.diemdanh.entity.Account;
import com.bv87.diemdanh.entity.AccountRole;
import com.bv87.diemdanh.entity.AttendanceUnlock;
import com.bv87.diemdanh.entity.AttendanceUnlockRequest;
import com.bv87.diemdanh.entity.Department;
import com.bv87.diemdanh.entity.Notification;
import com.bv87.diemdanh.entity.NotificationType;
import com.bv87.diemdanh.enums.UnlockRequestStatus;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.AccountRepository;
import com.bv87.diemdanh.repository.AttendanceUnlockRepository;
import com.bv87.diemdanh.repository.AttendanceUnlockRequestRepository;
import com.bv87.diemdanh.repository.DepartmentRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.util.CodeFormatter;
import com.bv87.diemdanh.util.VietnamTimeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * HEAD unlock-request queue — SPEC P15 §4.7.2.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceUnlockRequestService {

    private static final DateTimeFormatter DMY = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final int LIST_LIMIT = 100;

    private final AttendanceUnlockRequestRepository requestRepository;
    private final AttendanceUnlockRepository unlockRepository;
    private final DepartmentRepository departmentRepository;
    private final AccountRepository accountRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final VietnamTimeService timeService;
    private final AttendanceLockService lockService;

    @Transactional
    public UnlockRequestItemDto create(AuthUser authUser, UnlockRequestCreateRequest request) {
        if (!authUser.isHead()) {
            throw new AccessDeniedException("Chỉ Trưởng đơn vị được gửi yêu cầu mở khóa");
        }
        Integer deptCode = authUser.getDeptCode();
        if (deptCode == null) {
            throw new BusinessException("Tài khoản chưa gắn Đơn vị");
        }
        LocalDate date = request.getDate();
        LocalDate today = timeService.today();
        if (date.isAfter(today)) {
            throw new BusinessException("Không được yêu cầu mở khóa ngày tương lai.");
        }
        if (unlockRepository.existsByDeptCodeAndDate(deptCode, date)) {
            throw new BusinessException("Ngày này đã được mở khóa.");
        }
        if (lockService.isEditable(deptCode, AccountRole.HEAD, date)) {
            throw new BusinessException("Ngày này chưa khóa, không cần yêu cầu mở khóa.");
        }
        if (requestRepository.findByDeptDateAndStatus(deptCode, date, UnlockRequestStatus.PENDING).isPresent()) {
            throw new BusinessException("Đã có yêu cầu đang chờ Admin xác nhận.");
        }
        Department dept = departmentRepository.findById(deptCode)
                .orElseThrow(() -> new BusinessException(
                        "Đơn vị không tồn tại: " + CodeFormatter.formatDeptCode(deptCode)));
        String reason = request.getReason().trim();
        AttendanceUnlockRequest row = new AttendanceUnlockRequest();
        row.setDepartment(dept);
        row.setAttendanceDate(date);
        row.setReason(reason);
        row.setStatus(UnlockRequestStatus.PENDING);
        row.setRequestedBy(authUser.getUsername());
        row.setRequestedByAccountId(authUser.getAccount().getId());
        row.setRequestedAt(LocalDateTime.now());
        requestRepository.save(row);
        notifyAdmins(authUser, dept, date, reason);
        auditService.logAttendance(authUser, "ATTENDANCE_UNLOCK_REQUEST", deptCode, null, date,
                Map.of("reason", reason));
        return toItem(row);
    }

    @Transactional(readOnly = true)
    public List<UnlockRequestItemDto> list(AuthUser authUser, UnlockRequestStatus status) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin được xem hàng đợi yêu cầu mở khóa");
        }
        UnlockRequestStatus filter = status != null ? status : UnlockRequestStatus.PENDING;
        return requestRepository.search(filter).stream().limit(LIST_LIMIT).map(this::toItem).toList();
    }

    @Transactional(readOnly = true)
    public long countPending(AuthUser authUser) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin được xem hàng đợi yêu cầu mở khóa");
        }
        return requestRepository.countByStatus(UnlockRequestStatus.PENDING);
    }

    @Transactional
    public UnlockRequestItemDto approve(AuthUser authUser, Long id) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin được xác nhận mở khóa");
        }
        AttendanceUnlockRequest row = load(id);
        if (row.getStatus() != UnlockRequestStatus.PENDING) {
            throw new BusinessException("Yêu cầu đã được xử lý.");
        }
        persistUnlock(row.getDepartment(), row.getAttendanceDate(), row.getReason());
        markReviewed(row, authUser, UnlockRequestStatus.APPROVED, null);
        notifyHeadResult(row, true, null);
        auditService.logAttendance(authUser, "ATTENDANCE_UNLOCK_APPROVE", row.getDeptCode(), null,
                row.getAttendanceDate(), Map.of("requestId", row.getId()));
        return toItem(row);
    }

    @Transactional
    public UnlockRequestItemDto reject(AuthUser authUser, Long id, String note) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin được từ chối yêu cầu mở khóa");
        }
        AttendanceUnlockRequest row = load(id);
        if (row.getStatus() != UnlockRequestStatus.PENDING) {
            throw new BusinessException("Yêu cầu đã được xử lý.");
        }
        String reviewNote = note != null && !note.isBlank() ? note.trim() : null;
        markReviewed(row, authUser, UnlockRequestStatus.REJECTED, reviewNote);
        notifyHeadResult(row, false, reviewNote);
        auditService.logAttendance(authUser, "ATTENDANCE_UNLOCK_REJECT", row.getDeptCode(), null,
                row.getAttendanceDate(), Map.of("requestId", row.getId()));
        return toItem(row);
    }

    /**
     * When Admin unlocks directly (P14), close a matching HEAD pending request.
     */
    @Transactional
    public void completePendingOnDirectUnlock(AuthUser authUser, Integer deptCode, LocalDate date) {
        requestRepository.findByDeptDateAndStatus(deptCode, date, UnlockRequestStatus.PENDING)
                .ifPresent(row -> {
                    markReviewed(row, authUser, UnlockRequestStatus.APPROVED, null);
                    notifyHeadResult(row, true, null);
                });
    }

    @Transactional(readOnly = true)
    public AttendanceUnlockRequest latestFor(Integer deptCode, LocalDate date) {
        List<AttendanceUnlockRequest> rows =
                requestRepository.findByDeptAndDateOrderByRequestedAtDesc(deptCode, date);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private AttendanceUnlockRequest load(Long id) {
        return requestRepository.findWithDeptById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy yêu cầu mở khóa"));
    }

    private void persistUnlock(Department dept, LocalDate date, String reason) {
        if (unlockRepository.existsByDeptCodeAndDate(dept.getDeptCode(), date)) {
            return;
        }
        AttendanceUnlock unlock = new AttendanceUnlock();
        unlock.setDepartment(dept);
        unlock.setAttendanceDate(date);
        unlock.setReason(reason);
        unlockRepository.save(unlock);
    }

    private void markReviewed(
            AttendanceUnlockRequest row,
            AuthUser authUser,
            UnlockRequestStatus status,
            String reviewNote) {
        row.setStatus(status);
        row.setReviewedBy(authUser.getUsername());
        row.setReviewedAt(LocalDateTime.now());
        row.setReviewNote(reviewNote);
        requestRepository.save(row);
    }

    private void notifyAdmins(AuthUser head, Department dept, LocalDate date, String reason) {
        String dmy = date.format(DMY);
        String deptLabel = CodeFormatter.formatDeptCode(dept.getDeptCode()) + " " + dept.getDeptName();
        String body = "Trưởng đơn vị " + head.getAccount().getFullname()
                + " yêu cầu mở khóa ngày " + dmy + " — " + deptLabel + ". Lý do: " + reason;
        if (body.length() > 500) {
            body = body.substring(0, 497) + "...";
        }
        Long senderId = head.getAccount().getId();
        for (Account admin : accountRepository.findAllActiveByRole(AccountRole.ADMIN)) {
            Notification n = new Notification();
            n.setRecipientId(admin.getId());
            n.setSenderId(senderId);
            n.setType(NotificationType.UNLOCK_REQUEST);
            n.setTitle("Yêu cầu mở khóa ngày công");
            n.setBody(body);
            n.setDeptCode(dept.getDeptCode());
            n.setAttendanceDate(date);
            try {
                notificationService.saveIsolated(n);
            } catch (Exception ex) {
                log.warn("Không gửi được thông báo yêu cầu mở khóa cho admin id={}", admin.getId(), ex);
            }
        }
    }

    private void notifyHeadResult(AttendanceUnlockRequest row, boolean approved, String reviewNote) {
        String dmy = row.getAttendanceDate().format(DMY);
        Notification n = new Notification();
        n.setRecipientId(row.getRequestedByAccountId());
        n.setType(NotificationType.UNLOCK_REQUEST_RESULT);
        n.setTitle(approved ? "Đã mở khóa ngày công" : "Từ chối yêu cầu mở khóa");
        n.setBody(approved
                ? "Admin đã mở khóa ngày " + dmy + ". Bạn có thể chỉnh sửa Chấm công."
                : "Admin đã từ chối yêu cầu mở khóa ngày " + dmy
                        + (reviewNote != null ? ". Lý do: " + reviewNote : "."));
        n.setDeptCode(row.getDeptCode());
        n.setAttendanceDate(row.getAttendanceDate());
        try {
            notificationService.saveIsolated(n);
        } catch (Exception ex) {
            log.warn("Không gửi được thông báo kết quả mở khóa requestId={}", row.getId(), ex);
        }
    }

    private UnlockRequestItemDto toItem(AttendanceUnlockRequest row) {
        Department dept = row.getDepartment();
        return UnlockRequestItemDto.builder()
                .id(row.getId())
                .attendanceDate(row.getAttendanceDate())
                .deptCode(row.getDeptCode())
                .deptCodeFormatted(row.getDeptCode() != null ? CodeFormatter.formatDeptCode(row.getDeptCode()) : null)
                .deptName(dept != null ? dept.getDeptName() : null)
                .reason(row.getReason())
                .status(row.getStatus())
                .statusLabel(row.getStatus() != null ? row.getStatus().getLabel() : "")
                .requestedBy(row.getRequestedBy())
                .requestedAt(row.getRequestedAt())
                .reviewedBy(row.getReviewedBy())
                .reviewedAt(row.getReviewedAt())
                .reviewNote(row.getReviewNote())
                .build();
    }
}
