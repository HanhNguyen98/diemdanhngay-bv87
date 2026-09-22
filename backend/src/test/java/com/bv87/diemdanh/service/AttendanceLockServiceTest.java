package com.bv87.diemdanh.service;

import com.bv87.diemdanh.entity.Account;
import com.bv87.diemdanh.entity.AccountRole;
import com.bv87.diemdanh.entity.AttendanceRecord;
import com.bv87.diemdanh.entity.Department;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.AttendanceManualLockRepository;
import com.bv87.diemdanh.repository.AttendanceReportBlockRepository;
import com.bv87.diemdanh.repository.AttendanceUnlockRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.util.AttendanceValidity;
import com.bv87.diemdanh.util.VietnamTimeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** P17 — HEAD incomplete explain write after lock / past dates. */
class AttendanceLockServiceTest {

    private static final int DEPT = 1;
    private static final LocalDate TODAY = LocalDate.of(2026, 9, 9);

    private VietnamTimeService timeService;
    private AttendanceUnlockRepository unlockRepository;
    private AttendanceManualLockRepository manualLockRepository;
    private AttendanceReportBlockRepository reportBlockRepository;
    private AttendanceLockService lockService;
    private AuthUser head;

    @BeforeEach
    void setUp() {
        timeService = mock(VietnamTimeService.class);
        unlockRepository = mock(AttendanceUnlockRepository.class);
        manualLockRepository = mock(AttendanceManualLockRepository.class);
        reportBlockRepository = mock(AttendanceReportBlockRepository.class);
        lockService = new AttendanceLockService(
                timeService, unlockRepository, manualLockRepository, reportBlockRepository);

        when(timeService.today()).thenReturn(TODAY);
        when(timeService.isAfterLockTime()).thenReturn(true);
        when(timeService.formatLockTime()).thenReturn("16:00");
        when(unlockRepository.existsByDeptCodeAndDate(DEPT, TODAY)).thenReturn(false);
        when(manualLockRepository.existsByDeptCodeAndDate(DEPT, TODAY)).thenReturn(false);
        when(reportBlockRepository.findByAttendanceDateAndDeptCode(TODAY, DEPT))
                .thenReturn(Optional.empty());

        Department dept = new Department();
        dept.setDeptCode(DEPT);
        Account account = new Account();
        account.setRole(AccountRole.HEAD);
        account.setDepartment(dept);
        head = new AuthUser(account);
    }

    @Test
    void afterLockTimeIncompleteStaffWithNoteIsAllowed() {
        assertTrue(lockService.isIncompleteExplainAllowed(DEPT, AccountRole.HEAD, TODAY));
        lockService.assertCanWriteStaff(head, DEPT, TODAY, null, "Quên quét ra chiều");
    }

    @Test
    void afterLockTimeIncompleteStaffWithoutNoteIsRejected() {
        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> lockService.assertCanWriteStaff(head, DEPT, TODAY, null, "  "));
        assertEquals(AttendanceLockService.MSG_EXPLAIN_REQUIRED, ex.getMessage());
    }

    @Test
    void afterLockTimeCompleteStaffIsRejected() {
        AttendanceRecord complete = new AttendanceRecord();
        complete.setStatus(AttendanceValidity.NGHI_TRUC_FULL);
        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> lockService.assertCanWriteStaff(head, DEPT, TODAY, complete, "lý do"));
        assertEquals(AttendanceLockService.MSG_COMPLETE_LOCKED, ex.getMessage());
    }

    @Test
    void departmentLevelWriteStillBlockedAfterLock() {
        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> lockService.assertCanWrite(head, DEPT, TODAY));
        assertEquals(AttendanceLockService.MSG_SOFT_LOCKED, ex.getMessage());
    }

    @Test
    void pastIncompleteDayIsNotSkipped() {
        LocalDate yesterday = TODAY.minusDays(1);
        when(unlockRepository.existsByDeptCodeAndDate(DEPT, yesterday)).thenReturn(false);
        when(manualLockRepository.existsByDeptCodeAndDate(DEPT, yesterday)).thenReturn(false);
        when(reportBlockRepository.findByAttendanceDateAndDeptCode(yesterday, DEPT))
                .thenReturn(Optional.empty());

        assertTrue(lockService.isIncompleteExplainAllowed(DEPT, AccountRole.HEAD, yesterday));
        assertFalse(lockService.shouldSkipManualRangeDayForHead(DEPT, yesterday, null));

        AttendanceRecord complete = new AttendanceRecord();
        complete.setStatus(AttendanceValidity.NGHI_TRUC_FULL);
        assertTrue(lockService.shouldSkipManualRangeDayForHead(DEPT, yesterday, complete));
    }

    @Test
    void dutyBypassesSoftLockLikeAdmin() {
        Account account = new Account();
        account.setRole(AccountRole.DUTY);
        AuthUser duty = new AuthUser(account);

        assertTrue(lockService.isEditable(DEPT, AccountRole.DUTY, TODAY));
        lockService.assertCanWrite(duty, DEPT, TODAY);
        lockService.assertCanView(duty, DEPT);
    }
}
