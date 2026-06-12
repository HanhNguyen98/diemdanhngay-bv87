package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.*;
import com.bv87.diemdanh.entity.AttendanceRecord;
import com.bv87.diemdanh.entity.AttendanceStatus;
import com.bv87.diemdanh.entity.Department;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.AttendanceRecordRepository;
import com.bv87.diemdanh.repository.DepartmentRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.util.CodeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AttendanceStatisticsService {

    private static final DateTimeFormatter DMY_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final AttendanceRecordRepository attendanceRepository;
    private final DepartmentRepository departmentRepository;
    private final AttendanceLockService lockService;

    @Transactional(readOnly = true)
    public AttendanceStatisticsDto getStatistics(
            AuthUser authUser,
            Integer departmentCode,
            LocalDate from,
            LocalDate to,
            String search) {
        validateDateRange(from, to);

        Integer deptCode = resolveDeptCode(authUser, departmentCode);
        lockService.assertCanView(authUser, deptCode);

        Department dept = departmentRepository.findById(deptCode)
                .orElseThrow(() -> new BusinessException("Đơn vị không tồn tại"));

        String q = normalizeSearch(search);
        List<AttendanceRecord> records = attendanceRepository
                .findByDeptCodeAndDateBetween(deptCode, from, to).stream()
                .filter(r -> matchesSearch(r, q))
                .toList();

        long diLam = 0, nghiPhep = 0, diHoc = 0, diCongTac = 0;
        for (AttendanceRecord record : records) {
            switch (record.getStatus()) {
                case DI_LAM -> diLam++;
                case NGHI_PHEP -> nghiPhep++;
                case DI_HOC -> diHoc++;
                case DI_CONG_TAC -> diCongTac++;
            }
        }

        AttendanceStatisticsSummaryDto summary = AttendanceStatisticsSummaryDto.builder()
                .diLam(diLam)
                .nghiPhep(nghiPhep)
                .diHoc(diHoc)
                .diCongTac(diCongTac)
                .build();

        List<AttendanceTrendPointDto> trend = buildTrend(from, to, records);

        return AttendanceStatisticsDto.builder()
                .from(from)
                .to(to)
                .deptCode(dept.getDeptCode())
                .deptCodeFormatted(CodeFormatter.formatDeptCode(dept.getDeptCode()))
                .deptName(dept.getDeptName())
                .summary(summary)
                .trend(trend)
                .build();
    }

    @Transactional(readOnly = true)
    public AttendanceHistoryPageDto getHistoryPage(
            AuthUser authUser,
            Integer departmentCode,
            LocalDate from,
            LocalDate to,
            String search,
            int page,
            int pageSize) {
        validateDateRange(from, to);
        if (page < 1) {
            throw new BusinessException("Số trang không hợp lệ");
        }
        if (pageSize < 1 || pageSize > 500) {
            throw new BusinessException("Kích thước trang không hợp lệ");
        }

        Integer deptCode = resolveDeptCode(authUser, departmentCode);
        lockService.assertCanView(authUser, deptCode);

        String q = normalizeSearch(search);
        PageRequest pageable = PageRequest.of(
                page - 1,
                pageSize,
                Sort.by(Sort.Order.desc("attendanceDate"), Sort.Order.asc("employee.fullname")));

        Page<AttendanceRecord> result = attendanceRepository.findHistoryPage(deptCode, from, to, q, pageable);
        List<AttendanceHistoryItemDto> items = result.getContent().stream()
                .map(this::toHistoryItem)
                .toList();

        return AttendanceHistoryPageDto.builder()
                .items(items)
                .page(page)
                .pageSize(pageSize)
                .totalItems(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }

    @Transactional(readOnly = true)
    public List<AttendanceHistoryItemDto> getHistoryForExport(
            AuthUser authUser,
            Integer departmentCode,
            LocalDate from,
            LocalDate to,
            String search) {
        validateDateRange(from, to);

        Integer deptCode = resolveDeptCode(authUser, departmentCode);
        lockService.assertCanView(authUser, deptCode);

        String q = normalizeSearch(search);
        return attendanceRepository.findHistoryAll(deptCode, from, to, q).stream()
                .map(this::toHistoryItem)
                .toList();
    }

    private void validateDateRange(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new BusinessException("Khoảng thời gian không hợp lệ");
        }
        if (from.isAfter(to)) {
            throw new BusinessException("Ngày bắt đầu phải trước ngày kết thúc");
        }
    }

    private AttendanceHistoryItemDto toHistoryItem(AttendanceRecord record) {
        var employee = record.getEmployee();
        return AttendanceHistoryItemDto.builder()
                .recordId(record.getId())
                .attendanceDate(record.getAttendanceDate())
                .attendanceDateFormatted(record.getAttendanceDate().format(DMY_FMT))
                .empCode(employee.getEmpCode())
                .empCodeFormatted(CodeFormatter.formatEmpCode(employee.getEmpCode()))
                .fullname(employee.getFullname())
                .avatarUrl(employee.getAvatarUrl())
                .status(record.getStatus())
                .statusLabel(record.getStatus().getLabel())
                .note(record.getNote())
                .build();
    }

    private Integer resolveDeptCode(AuthUser authUser, Integer requestedCode) {
        if (authUser.isAdmin()) {
            if (requestedCode == null) {
                throw new BusinessException("Admin cần chọn mã Đơn vị");
            }
            return requestedCode;
        }
        return authUser.getDeptCode();
    }

    private String normalizeSearch(String search) {
        if (search == null) {
            return null;
        }
        String trimmed = search.trim();
        return trimmed.isEmpty() ? null : trimmed.toLowerCase(Locale.ROOT);
    }

    private boolean matchesSearch(AttendanceRecord record, String q) {
        if (q == null) {
            return true;
        }
        String fullname = record.getEmployee().getFullname();
        if (fullname != null && fullname.toLowerCase(Locale.ROOT).contains(q)) {
            return true;
        }
        String empFormatted = CodeFormatter.formatEmpCode(record.getEmpCode());
        return empFormatted.contains(q) || String.valueOf(record.getEmpCode()).contains(q);
    }

    private List<AttendanceTrendPointDto> buildTrend(LocalDate from, LocalDate to, List<AttendanceRecord> records) {
        List<DateBucket> buckets = buildWeekBuckets(from, to);
        List<AttendanceTrendPointDto> trend = new ArrayList<>();

        for (DateBucket bucket : buckets) {
            long diLam = 0, nghiPhep = 0, diHoc = 0, diCongTac = 0;
            for (AttendanceRecord record : records) {
                LocalDate d = record.getAttendanceDate();
                if (d.isBefore(bucket.from()) || d.isAfter(bucket.to())) {
                    continue;
                }
                switch (record.getStatus()) {
                    case DI_LAM -> diLam++;
                    case NGHI_PHEP -> nghiPhep++;
                    case DI_HOC -> diHoc++;
                    case DI_CONG_TAC -> diCongTac++;
                }
            }
            trend.add(AttendanceTrendPointDto.builder()
                    .label(bucket.label())
                    .diLam(diLam)
                    .nghiPhep(nghiPhep)
                    .diHoc(diHoc)
                    .diCongTac(diCongTac)
                    .build());
        }
        return trend;
    }

    /** Chia khoảng [from, to] thành tối đa 4 tuần + bucket cuối "Hiện tại". */
    private List<DateBucket> buildWeekBuckets(LocalDate from, LocalDate to) {
        List<DateBucket> buckets = new ArrayList<>();
        LocalDate cursor = from;
        int weekNum = 1;

        while (!cursor.isAfter(to) && buckets.size() < 4) {
            LocalDate end = cursor.plusDays(6);
            if (end.isAfter(to)) {
                end = to;
            }
            buckets.add(new DateBucket("Tuần " + weekNum, cursor, end));
            cursor = end.plusDays(1);
            weekNum++;
        }

        if (!cursor.isAfter(to)) {
            buckets.add(new DateBucket("Hiện tại", cursor, to));
        }

        if (buckets.isEmpty()) {
            buckets.add(new DateBucket("Hiện tại", from, to));
        }
        return buckets;
    }

    private record DateBucket(String label, LocalDate from, LocalDate to) {}
}
