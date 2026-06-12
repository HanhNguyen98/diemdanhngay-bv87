package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.ReportBlockRequest;
import com.bv87.diemdanh.entity.AttendanceReportBlock;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.AttendanceReportBlockRepository;
import com.bv87.diemdanh.repository.DepartmentRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.util.CodeFormatter;
import com.bv87.diemdanh.util.VietnamTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AttendanceReportService {

    private final AttendanceReportBlockRepository reportBlockRepository;
    private final DepartmentRepository departmentRepository;
    private final VietnamTimeService timeService;

    @Transactional
    public void blockReport(AuthUser authUser, ReportBlockRequest request) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới được khóa gửi báo cáo");
        }
        Integer deptCode = request.getDeptCode();
        departmentRepository.findById(deptCode)
                .orElseThrow(() -> new BusinessException(
                        "Đơn vị không tồn tại: " + CodeFormatter.formatDeptCode(deptCode)));

        var today = timeService.today();
        if (reportBlockRepository.findByAttendanceDateAndDeptCode(today, deptCode).isPresent()) {
            throw new BusinessException("ĐƠN VỊ này đã bị khóa gửi báo cáo hôm nay.");
        }

        AttendanceReportBlock block = new AttendanceReportBlock();
        block.setAttendanceDate(today);
        block.setDeptCode(deptCode);
        block.setReason(request.getReason() != null ? request.getReason().trim() : null);
        block.setBlockedBy(authUser.getAccount().getId());
        reportBlockRepository.save(block);
    }

    @Transactional
    public void unblockReport(AuthUser authUser, Integer deptCode) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới được mở khóa gửi báo cáo");
        }
        var today = timeService.today();
        if (reportBlockRepository.findByAttendanceDateAndDeptCode(today, deptCode).isEmpty()) {
            throw new BusinessException("ĐƠN VỊ này chưa bị khóa gửi báo cáo hôm nay.");
        }
        reportBlockRepository.deleteByAttendanceDateAndDeptCode(today, deptCode);
    }
}
