package com.bv87.diemdanh.util;

import com.bv87.diemdanh.dto.StatusBreakdownItemDto;
import com.bv87.diemdanh.entity.AttendanceRecord;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** D-STAT.1 — statistics KPI counts every history record. */
class StatisticsHistoryTallyTest {

    @Test
    void incompleteDiTreIsCounted() {
        AttendanceRecord late = record("DI_TRE");
        assertTrue(!AttendanceValidity.isComplete(late));

        StatisticsHistoryTally.Result result = StatisticsHistoryTally.tally(List.of(late));

        assertEquals(1L, result.statusCounts().get("DI_TRE"));
        assertEquals(0L, result.uncheckedCount());
        assertEquals(1L, result.totalRecords());
    }

    @Test
    void nullStatusBecomesUnchecked() {
        AttendanceRecord blank = record(null);
        AttendanceRecord empty = record("  ");

        StatisticsHistoryTally.Result result = StatisticsHistoryTally.tally(List.of(blank, empty));

        assertTrue(result.statusCounts().isEmpty());
        assertEquals(2L, result.uncheckedCount());
        assertEquals(2L, result.totalRecords());
    }

    @Test
    void incompleteHalfDayIsCountedAsChildCode() {
        AttendanceRecord half = record("NGHI_TRUC_HALF");
        half.setPayrollFillStatus("PENDING");
        assertTrue(!AttendanceValidity.isComplete(half));

        StatisticsHistoryTally.Result result = StatisticsHistoryTally.tally(List.of(
                half,
                record("NGHI_TRUC_FULL")));

        assertEquals(1L, result.statusCounts().get("NGHI_TRUC_HALF"));
        assertEquals(1L, result.statusCounts().get("NGHI_TRUC_FULL"));
        assertEquals(2L, result.totalRecords());
    }

    @Test
    void sumEqualsRecordCount() {
        List<AttendanceRecord> records = List.of(
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
                record(null),
                record("DI_TRE"),
                record("DI_TRE"),
                record("DI_LAM"));

        StatisticsHistoryTally.Result result = StatisticsHistoryTally.tally(records);

        assertEquals(14L, result.totalRecords());
        assertEquals(14, records.size());
        assertEquals(6L, result.uncheckedCount());
        assertEquals(3L, result.statusCounts().get("DI_TRE"));
    }

    @Test
    void withUncheckedAppendsChipWhenCountPositive() {
        StatusBreakdownItemDto late = StatusBreakdownItemDto.builder()
                .code("DI_TRE")
                .label("ĐI TRỄ")
                .badgeLabel("ĐI TRỄ")
                .count(3)
                .children(List.of())
                .build();

        List<StatusBreakdownItemDto> breakdown = StatisticsHistoryTally.withUnchecked(List.of(late), 6);

        assertEquals(2, breakdown.size());
        StatusBreakdownItemDto unchecked = breakdown.get(1);
        assertEquals(StatisticsHistoryTally.UNCHECKED_CODE, unchecked.getCode());
        assertEquals(StatisticsHistoryTally.UNCHECKED_LABEL, unchecked.getLabel());
        assertEquals(StatisticsHistoryTally.UNCHECKED_LABEL, unchecked.getBadgeLabel());
        assertEquals(6L, unchecked.getCount());
        assertEquals(9L, breakdown.stream().mapToLong(StatusBreakdownItemDto::getCount).sum());
    }

    @Test
    void withUncheckedOmitsChipWhenZero() {
        List<StatusBreakdownItemDto> breakdown = StatisticsHistoryTally.withUnchecked(List.of(), 0);
        assertTrue(breakdown.isEmpty());
        assertEquals(Map.of(), StatisticsHistoryTally.tally(List.of()).statusCounts());
    }

    private static AttendanceRecord record(String status) {
        AttendanceRecord row = new AttendanceRecord();
        row.setStatus(status);
        return row;
    }
}
