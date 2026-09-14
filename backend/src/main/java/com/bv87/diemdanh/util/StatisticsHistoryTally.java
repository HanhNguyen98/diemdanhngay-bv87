package com.bv87.diemdanh.util;

import com.bv87.diemdanh.dto.StatusBreakdownItemDto;
import com.bv87.diemdanh.entity.AttendanceRecord;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * D-STAT.1 — count every history record for statistics KPI/trend.
 * Does not use {@link AttendanceValidity#isComplete(AttendanceRecord)}.
 */
public final class StatisticsHistoryTally {

    public static final String UNCHECKED_CODE = "UNCHECKED";
    public static final String UNCHECKED_LABEL = "CHƯA CHẤM";

    private StatisticsHistoryTally() {
    }

    public record Result(Map<String, Long> statusCounts, long uncheckedCount) {
        public long totalRecords() {
            return statusCounts.values().stream().mapToLong(Long::longValue).sum() + uncheckedCount;
        }
    }

    /**
     * @param records attendance rows already filtered like history ({@code findHistoryAll})
     * @return per-status counts (blank status excluded) plus unchecked count
     */
    public static Result tally(Collection<AttendanceRecord> records) {
        Map<String, Long> statusCounts = new HashMap<>();
        long unchecked = 0;
        if (records == null) {
            return new Result(statusCounts, 0);
        }
        for (AttendanceRecord record : records) {
            String status = record.getStatus();
            if (status == null || status.isBlank()) {
                unchecked++;
            } else {
                statusCounts.merge(status, 1L, Long::sum);
            }
        }
        return new Result(statusCounts, unchecked);
    }

    /**
     * Appends the CHƯA CHẤM chip after catalog grouping. Sentinel is not a catalog row.
     *
     * @param catalogBreakdown output of {@code StatusCatalogService.buildBreakdown}
     * @param uncheckedCount   blank-status rows
     * @return copy with UNCHECKED appended when count &gt; 0
     */
    public static List<StatusBreakdownItemDto> withUnchecked(
            List<StatusBreakdownItemDto> catalogBreakdown,
            long uncheckedCount) {
        List<StatusBreakdownItemDto> result = catalogBreakdown == null
                ? new ArrayList<>()
                : new ArrayList<>(catalogBreakdown);
        if (uncheckedCount <= 0) {
            return result;
        }
        result.add(StatusBreakdownItemDto.builder()
                .code(UNCHECKED_CODE)
                .label(UNCHECKED_LABEL)
                .badgeLabel(UNCHECKED_LABEL)
                .colorKey("purple")
                .iconKey("pending")
                .sortOrder(1000)
                .count(uncheckedCount)
                .children(List.of())
                .build());
        return result;
    }
}
