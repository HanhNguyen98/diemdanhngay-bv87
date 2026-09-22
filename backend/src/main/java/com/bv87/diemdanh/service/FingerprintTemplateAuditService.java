package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.FingerprintTemplateAuditLogItemDto;
import com.bv87.diemdanh.dto.FingerprintTemplateAuditLogPageDto;
import com.bv87.diemdanh.entity.Department;
import com.bv87.diemdanh.entity.FingerprintTemplateAuditLog;
import com.bv87.diemdanh.enums.FingerprintTemplateAuditAction;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.repository.DepartmentRepository;
import com.bv87.diemdanh.repository.FingerprintTemplateAuditLogRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.util.CodeFormatter;
import com.bv87.diemdanh.util.RequestClientInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FingerprintTemplateAuditService {

    private final FingerprintTemplateAuditLogRepository repository;
    private final DepartmentRepository departmentRepository;
    private final AccountScreenService accountScreenService;

    @Transactional
    public void log(
            FingerprintTemplateAuditAction action,
            Integer empCode,
            Integer deptCode,
            String empFullname,
            String actorUsername,
            String actorRole,
            String kioskLabel,
            String fingerLabel,
            String note) {
        try {
            FingerprintTemplateAuditLog row = new FingerprintTemplateAuditLog();
            row.setAction(action);
            row.setEmpCode(empCode);
            row.setDeptCode(deptCode);
            row.setEmpFullname(empFullname);
            row.setActorUsername(actorUsername);
            row.setActorRole(actorRole);
            row.setKioskLabel(kioskLabel);
            row.setFingerLabel(fingerLabel);
            row.setClientIp(RequestClientInfo.ip());
            row.setNote(note);
            repository.save(row);
        } catch (Exception ex) {
            log.warn("Không ghi được fingerprint template audit: {}", action, ex);
        }
    }

    @Transactional(readOnly = true)
    public FingerprintTemplateAuditLogPageDto listForAdmin(
            AuthUser authUser,
            LocalDate from,
            LocalDate to,
            Integer deptCode,
            int page,
            int pageSize) {
        if (!canViewFingerprintHistory(authUser)) {
            throw new AccessDeniedException("Không có quyền xem lịch sử vân tay");
        }
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDate today = LocalDate.now(zone);
        LocalDate fromDate = from != null ? from : today.withDayOfMonth(1);
        LocalDate toDate = to != null ? to : today;
        if (toDate.isBefore(fromDate)) {
            toDate = fromDate;
        }
        int size = Math.min(Math.max(pageSize, 1), 100);
        int pageIndex = Math.max(page - 1, 0);
        Instant fromInstant = fromDate.atStartOfDay(zone).toInstant();
        Instant toInstant = toDate.plusDays(1).atStartOfDay(zone).toInstant();

        Page<FingerprintTemplateAuditLog> result = repository.search(
                fromInstant,
                toInstant,
                deptCode,
                PageRequest.of(pageIndex, size, Sort.by(Sort.Direction.DESC, "createdAt")));

        Map<Integer, Department> depts = departmentRepository.findAll().stream()
                .collect(Collectors.toMap(Department::getDeptCode, Function.identity(), (a, b) -> a));
        return FingerprintTemplateAuditLogPageDto.builder()
                .items(result.getContent().stream().map(row -> toItem(row, depts)).toList())
                .page(pageIndex + 1)
                .pageSize(size)
                .totalItems(result.getTotalElements())
                .totalPages(Math.max(result.getTotalPages(), 1))
                .build();
    }

    private boolean canViewFingerprintHistory(AuthUser authUser) {
        if (authUser.isAdmin()) {
            return true;
        }
        return authUser.isDuty() && accountScreenService.hasScreen(authUser, "admin.fingerprint-history");
    }

    private FingerprintTemplateAuditLogItemDto toItem(
            FingerprintTemplateAuditLog row, Map<Integer, Department> depts) {
        Department dept = row.getDeptCode() != null ? depts.get(row.getDeptCode()) : null;
        return FingerprintTemplateAuditLogItemDto.builder()
                .id(row.getId())
                .createdAt(row.getCreatedAt())
                .action(row.getAction().name())
                .actionLabel(row.getAction().getLabel())
                .empCode(row.getEmpCode())
                .empCodeFormatted(CodeFormatter.formatEmpCode(row.getEmpCode()))
                .empFullname(row.getEmpFullname())
                .deptCode(row.getDeptCode())
                .deptCodeFormatted(CodeFormatter.formatDeptCode(row.getDeptCode()))
                .deptName(dept != null ? dept.getDeptName() : null)
                .unitCode(dept != null ? dept.getUnitCode() : null)
                .actorUsername(row.getActorUsername())
                .actorRole(row.getActorRole())
                .kioskLabel(row.getKioskLabel())
                .fingerLabel(row.getFingerLabel())
                .clientIp(row.getClientIp())
                .note(row.getNote())
                .build();
    }
}
