package com.bv87.diemdanh.service;

import com.bv87.diemdanh.entity.AccountRole;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.AttendanceLockedException;
import com.bv87.diemdanh.repository.AttendanceManualLockRepository;
import com.bv87.diemdanh.repository.AttendanceUnlockRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.util.VietnamTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * Enforces the 06:00–16:00 attendance window and post-cutoff lock rules.
 * User-facing error messages are returned in Vietnamese.
 */
@Service
@RequiredArgsConstructor
public class AttendanceLockService {

    private final VietnamTimeService timeService;
    private final AttendanceUnlockRepository unlockRepository;
    private final AttendanceManualLockRepository manualLockRepository;

    /** @return true if current Vietnam time is after the 16:00 cutoff */
    public boolean isAfterLockTime() {
        return timeService.isAfterLockTime();
    }

    /**
     * @param deptCode department identifier
     * @param date     attendance date
     * @return true if admin has granted an unlock for this department on the given date
     */
    public boolean isUnlocked(Integer deptCode, LocalDate date) {
        return unlockRepository.existsByDeptCodeAndDate(deptCode, date);
    }

    /**
     * @return true when admin has manually locked the department before the daily cutoff
     */
    public boolean isManualLocked(Integer deptCode, LocalDate date) {
        return manualLockRepository.existsByDeptCodeAndDate(deptCode, date);
    }

    /**
     * A department is locked when the date is not today, admin locked early,
     * or the date is today past 16:00 without an unlock record.
     */
    public boolean isDepartmentLocked(Integer deptCode, LocalDate date) {
        if (!date.equals(timeService.today())) {
            return true;
        }
        if (isManualLocked(deptCode, date)) {
            return true;
        }
        if (!timeService.isAfterLockTime()) {
            return false;
        }
        return !isUnlocked(deptCode, date);
    }

    /**
     * Determines whether the given role may edit attendance for a department on a date.
     * Admin is always editable; HEAD follows the time window and unlock rules.
     */
    public boolean isEditable(Integer deptCode, AccountRole role, LocalDate date) {
        if (!date.equals(timeService.today())) {
            return false;
        }
        if (role == AccountRole.ADMIN) {
            return true;
        }
        if (role != AccountRole.HEAD) {
            return false;
        }
        if (timeService.isBeforeOpenWindow()) {
            return false;
        }
        return !isDepartmentLocked(deptCode, date);
    }

    /**
     * Validates write permission before persisting an attendance record.
     *
     * @throws AccessDeniedException      when role or department scope is invalid
     * @throws AttendanceLockedException  when past 16:00 without unlock
     */
    public void assertCanWrite(AuthUser authUser, Integer targetDeptCode, LocalDate date) {
        if (!date.equals(timeService.today())) {
            throw new AccessDeniedException("Chỉ được cập nhật điểm danh trong ngày hiện tại");
        }
        if (authUser.isAdmin()) {
            return;
        }
        if (!authUser.isHead()) {
            throw new AccessDeniedException("Bạn không có quyền cập nhật điểm danh");
        }
        if (!targetDeptCode.equals(authUser.getDeptCode())) {
            throw new AccessDeniedException(
                    "Trưởng ban chỉ được thao tác Đơn vị "
                            + String.format("%02d", authUser.getDeptCode()));
        }
        if (timeService.isBeforeOpenWindow()) {
            throw new AccessDeniedException("Hệ thống mở cửa từ 06:00 sáng");
        }
        if (isDepartmentLocked(targetDeptCode, date)) {
            throw new AttendanceLockedException(resolveLockMessage(targetDeptCode, date));
        }
    }

    /**
     * Validates read permission for department-scoped data.
     *
     * @throws AccessDeniedException when HEAD tries to access another department
     */
    public void assertCanView(AuthUser authUser, Integer targetDeptCode) {
        if (authUser.isAdmin()) {
            return;
        }
        if (authUser.isHead() && targetDeptCode.equals(authUser.getDeptCode())) {
            return;
        }
        throw new AccessDeniedException(
                "Bạn không có quyền xem dữ liệu Đơn vị " + String.format("%02d", targetDeptCode));
    }

    /**
     * Returns a Vietnamese status message for the UI, or null when no lock applies.
     */
    public String getLockMessage(Integer deptCode, AccountRole role, LocalDate date) {
        if (role == AccountRole.ADMIN) {
            return null;
        }
        if (timeService.isBeforeOpenWindow() && date.equals(timeService.today())) {
            return "Hệ thống mở cửa từ 06:00 sáng";
        }
        if (isDepartmentLocked(deptCode, date)) {
            return resolveLockMessage(deptCode, date);
        }
        return null;
    }

    public String buildLockMessage() {
        return "Hệ thống đã tự động khóa lúc " + timeService.formatLockTime()
                + ". Liên hệ Admin nếu cần chỉnh sửa.";
    }

    private String resolveLockMessage(Integer deptCode, LocalDate date) {
        if (isManualLocked(deptCode, date)) {
            return "Admin đã khóa sổ điểm danh cho Đơn vị hôm nay.";
        }
        return buildLockMessage();
    }
}
