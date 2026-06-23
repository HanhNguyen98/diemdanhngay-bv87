package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.AdminDashboardDto;
import com.bv87.diemdanh.dto.AdminDashboardKpiDto;
import com.bv87.diemdanh.dto.AttendanceSummaryDto;
import com.bv87.diemdanh.dto.StatusBreakdownItemDto;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.util.VietnamTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final AttendanceService attendanceService;
    private final AttendanceStatusCatalogService statusCatalogService;
    private final VietnamTimeService timeService;

    @Transactional(readOnly = true)
    public AdminDashboardDto getDashboard(AuthUser authUser) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới xem bảng điều khiển");
        }
        LocalDate today = timeService.today();
        List<AttendanceSummaryDto> departments = attendanceService.getAllSummaries(authUser, today);

        long total = 0;
        long unchecked = 0;
        List<List<StatusBreakdownItemDto>> breakdownParts = new ArrayList<>();
        for (AttendanceSummaryDto s : departments) {
            total += s.getTotal();
            unchecked += s.getUncheckedCount();
            if (s.getStatusBreakdown() != null) {
                breakdownParts.add(s.getStatusBreakdown());
            }
        }

        AdminDashboardKpiDto kpi = AdminDashboardKpiDto.builder()
                .total(total)
                .statusBreakdown(statusCatalogService.mergeBreakdowns(breakdownParts))
                .unchecked(unchecked)
                .build();

        return AdminDashboardDto.builder()
                .attendanceDate(today)
                .kpi(kpi)
                .departments(departments)
                .build();
    }
}
