package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.AttendanceStatisticsDto;
import com.bv87.diemdanh.dto.StatusBreakdownItemDto;
import com.bv87.diemdanh.entity.Account;
import com.bv87.diemdanh.entity.AccountRole;
import com.bv87.diemdanh.entity.AttendanceRecord;
import com.bv87.diemdanh.entity.Department;
import com.bv87.diemdanh.repository.AttendanceRecordRepository;
import com.bv87.diemdanh.repository.DepartmentRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.util.StatisticsHistoryTally;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** D-STAT.1 — KPI statistics uses the same rows as history. */
class AttendanceStatisticsServiceTest {

    private static final int DEPT = 2;
    private static final LocalDate FROM = LocalDate.of(2026, 9, 1);
    private static final LocalDate TO = LocalDate.of(2026, 9, 30);

    private AttendanceRecordRepository attendanceRepository;
    private DepartmentRepository departmentRepository;
    private AttendanceLockService lockService;
    private AttendanceStatusCatalogService statusCatalogService;
    private AttendanceStatisticsService service;
    private AuthUser head;

    @BeforeEach
    void setUp() {
        attendanceRepository = mock(AttendanceRecordRepository.class);
        departmentRepository = mock(DepartmentRepository.class);
        lockService = mock(AttendanceLockService.class);
        statusCatalogService = mock(AttendanceStatusCatalogService.class);
        service = new AttendanceStatisticsService(
                attendanceRepository, departmentRepository, lockService, statusCatalogService);

        Department dept = new Department();
        dept.setDeptCode(DEPT);
        dept.setDeptName("Kế hoạch-Tổng hợp");
        Account account = new Account();
        account.setRole(AccountRole.HEAD);
        account.setDepartment(dept);
        head = new AuthUser(account);

        when(departmentRepository.findById(DEPT)).thenReturn(Optional.of(dept));
        when(statusCatalogService.buildBreakdown(any())).thenAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            Map<String, Long> counts = invocation.getArgument(0);
            return counts.entrySet().stream()
                    .map(entry -> StatusBreakdownItemDto.builder()
                            .code(entry.getKey())
                            .label(entry.getKey())
                            .badgeLabel(entry.getKey())
                            .count(entry.getValue())
                            .children(List.of())
                            .build())
                    .toList();
        });
    }

    @Test
    void kpiCountsEveryHistoryRecordIncludingIncompleteAndUnchecked() {
        List<AttendanceRecord> records = List.of(
                record("DI_TRE"),
                record("DI_TRE"),
                record("DI_TRE"),
                record("DI_CONG_TAC"),
                record("THAI_SAN"),
                record("NGHI_TRUC_FULL"),
                record("NGHI_TRUC_HALF"),
                record(null),
                record(null),
                record(null),
                record(null),
                record(null),
                record(null));
        when(attendanceRepository.findHistoryAll(DEPT, FROM, TO, null)).thenReturn(records);

        AttendanceStatisticsDto dto = service.getStatistics(head, DEPT, FROM, TO, null);
        List<StatusBreakdownItemDto> breakdown = dto.getSummary().getStatusBreakdown();

        assertEquals(13L, breakdown.stream().mapToLong(StatusBreakdownItemDto::getCount).sum());
        assertEquals(3L, countOf(breakdown, "DI_TRE"));
        assertEquals(1L, countOf(breakdown, "NGHI_TRUC_HALF"));
        assertEquals(6L, countOf(breakdown, StatisticsHistoryTally.UNCHECKED_CODE));
        assertEquals(
                StatisticsHistoryTally.UNCHECKED_LABEL,
                breakdown.stream()
                        .filter(item -> StatisticsHistoryTally.UNCHECKED_CODE.equals(item.getCode()))
                        .findFirst()
                        .orElseThrow()
                        .getBadgeLabel());
        verify(attendanceRepository, never()).findByDeptCodeAndDateBetween(any(), any(), any());
    }

    @Test
    void kpiUsesSameHistorySearchAsFindHistoryAll() {
        when(attendanceRepository.findHistoryAll(eq(DEPT), eq(FROM), eq(TO), eq("an")))
                .thenReturn(List.of(record("DI_LAM")));

        AttendanceStatisticsDto dto = service.getStatistics(head, DEPT, FROM, TO, "An");

        assertEquals(1L, dto.getSummary().getStatusBreakdown().stream()
                .mapToLong(StatusBreakdownItemDto::getCount)
                .sum());
        verify(attendanceRepository).findHistoryAll(DEPT, FROM, TO, "an");
    }

    @Test
    void trendAlsoCountsIncompleteRecords() {
        AttendanceRecord late = record("DI_TRE");
        late.setAttendanceDate(FROM);
        when(attendanceRepository.findHistoryAll(DEPT, FROM, FROM, null)).thenReturn(List.of(late));

        AttendanceStatisticsDto dto = service.getStatistics(head, DEPT, FROM, FROM, null);

        assertTrue(dto.getTrend().stream().anyMatch(point ->
                countOf(point.getStatusBreakdown(), "DI_TRE") == 1L));
    }

    private static long countOf(List<StatusBreakdownItemDto> breakdown, String code) {
        return breakdown.stream()
                .filter(item -> code.equals(item.getCode()))
                .mapToLong(StatusBreakdownItemDto::getCount)
                .findFirst()
                .orElse(0L);
    }

    private static AttendanceRecord record(String status) {
        AttendanceRecord row = new AttendanceRecord();
        row.setStatus(status);
        row.setAttendanceDate(FROM);
        return row;
    }
}
