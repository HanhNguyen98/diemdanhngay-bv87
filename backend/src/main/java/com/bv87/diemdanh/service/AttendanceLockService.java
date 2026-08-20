package com.bv87.diemdanh.service;

import com.bv87.diemdanh.entity.AccountRole;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.AttendanceManualLockRepository;
import com.bv87.diemdanh.repository.AttendanceReportBlockRepository;
import com.bv87.diemdanh.repository.AttendanceUnlockRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.util.VietnamTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * Department lock helpers. SPEC_FINGERPRINT §4.7 / §4.9 + SPEC_AI_ASSISTANT §3.2.
 */
@Service
@RequiredArgsConstructor
public class AttendanceLockService {

    private final VietnamTimeService timeService;
    private final AttendanceUnlockRepository unlockRepository;
    private final AttendanceManualLockRepository manualLockRepository;
    private final AttendanceReportBlockRepository reportBlockRepository;

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
     * Legacy lock flag for Admin dashboard. Does not gate HEAD write (§4.9).
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
     * Whether the role may edit attendance for a department on a date.
     * HEAD today: before soft-lock (unless unlock) and not reportBlocked.
     * HEAD past: only if Admin unlocked that exact date — SPEC P14.
     * HEAD future: allowed (leave planning, no unlock).
     * Admin: always.
     */
    public boolean isEditable(Integer deptCode, AccountRole role, LocalDate date) {
        if (role == AccountRole.ADMIN) {
            return true;
        }
        if (role != AccountRole.HEAD) {
            return false;
        }
        LocalDate today = timeService.today();
        if (date.isAfter(today)) {
            return true;
        }
        if (date.equals(today) && isReportBlocked(deptCode, date)) {
            return false;
        }
        if (date.equals(today)) {
            if (isManualLocked(deptCode, date)) {
                return false;
            }
            if (!timeService.isAfterLockTime()) {
                return true;
            }
            return isUnlocked(deptCode, date);
        }
        return isUnlocked(deptCode, date);
    }

    /** Admin dashboard “khóa chỉnh sửa” for a dept/day — also gates HEAD writes. */
    public boolean isReportBlocked(Integer deptCode, LocalDate date) {
        return reportBlockRepository.findByAttendanceDateAndDeptCode(date, deptCode).isPresent();
    }

    /**
     * Validates role/dept for manual range assign — dates may be past/future (SPEC §3.2.1).
     */
    public void assertCanAssignManual(AuthUser authUser, Integer targetDeptCode) {
        if (authUser.isAdmin()) {
            return;
        }
        if (!authUser.isHead()) {
            throw new AccessDeniedException("Bạn không có quyền cập nhật Chấm công");
        }
        if (!targetDeptCode.equals(authUser.getDeptCode())) {
            throw new AccessDeniedException(
                    "Trưởng ban chỉ được thao tác Đơn vị "
                            + String.format("%02d", authUser.getDeptCode()));
        }
    }

    /**
     * Validates write permission before persisting an attendance record.
     * SPEC §4.7 P5 + SPEC_AI_ASSISTANT §3.2 — soft-lock and reportBlocked for HEAD.
     *
     * @throws AccessDeniedException when role or department scope is invalid
     * @throws BusinessException when soft-locked or report-blocked for HEAD
     */
    public void assertCanWrite(AuthUser authUser, Integer targetDeptCode, LocalDate date) {
        if (authUser.isAdmin()) {
            return;
        }
        if (!authUser.isHead()) {
            throw new AccessDeniedException("Bạn không có quyền cập nhật Chấm công");
        }
        if (!targetDeptCode.equals(authUser.getDeptCode())) {
            throw new AccessDeniedException(
                    "Trưởng ban chỉ được thao tác Đơn vị "
                            + String.format("%02d", authUser.getDeptCode()));
        }
        if (date.equals(timeService.today()) && isReportBlocked(targetDeptCode, date)) {
            throw new BusinessException(
                    "Admin đã khóa chỉnh sửa Chấm công cho Đơn vị hôm nay.");
        }
        if (!isEditable(targetDeptCode, AccountRole.HEAD, date)) {
            if (date.isBefore(timeService.today())) {
                throw new BusinessException(
                        "Ngày quá khứ chưa được Admin mở khóa. Liên hệ Admin nếu cần chỉnh sửa.");
            }
            throw new BusinessException(
                    "Đã qua giờ khóa mềm ngày công. Liên hệ Admin nếu cần chỉnh sửa.");
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
                "Bạn không có quyền xem dữ liệu Đơn vị " + String.format("%02d", authUser.getDeptCode()));
    }

    /**
     * @return true when HEAD cannot write today due to soft-lock / manual lock (not reportBlocked alone).
     */
    public boolean isSoftLockedForHead(Integer deptCode, LocalDate date) {
        if (isReportBlocked(deptCode, date) && date.equals(timeService.today())) {
            return false;
        }
        return !isEditable(deptCode, AccountRole.HEAD, date);
    }

    /**
     * True when HEAD must skip this calendar day in a manual range (soft-lock, past not unlocked).
     */
    public boolean shouldSkipManualRangeDayForHead(Integer deptCode, LocalDate day) {
        return !isEditable(deptCode, AccountRole.HEAD, day);
    }

    /**
     * Legacy UI message for Admin lock flags.
     */
    public String getLockMessage(Integer deptCode, AccountRole role, LocalDate date) {
        if (role == AccountRole.ADMIN || role == AccountRole.HEAD) {
            return null;
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
            return "Admin đã khóa sổ Chấm công cho Đơn vị hôm nay.";
        }
        return buildLockMessage();
    }
}
