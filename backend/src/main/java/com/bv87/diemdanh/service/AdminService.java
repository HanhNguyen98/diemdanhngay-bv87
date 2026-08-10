package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.*;
import com.bv87.diemdanh.entity.Account;
import com.bv87.diemdanh.entity.AccountRole;
import com.bv87.diemdanh.entity.Department;
import com.bv87.diemdanh.entity.DepartmentGroup;
import com.bv87.diemdanh.entity.Employee;
import com.bv87.diemdanh.entity.EmployeeDepartmentAssignment;
import com.bv87.diemdanh.entity.EmployeeFingerprint;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.AccountRepository;
import com.bv87.diemdanh.repository.DepartmentGroupRepository;
import com.bv87.diemdanh.repository.DepartmentRepository;
import com.bv87.diemdanh.repository.EmployeeDepartmentAssignmentRepository;
import com.bv87.diemdanh.repository.EmployeeFingerprintRepository;
import com.bv87.diemdanh.repository.EmployeeRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.util.CodeAllocator;
import com.bv87.diemdanh.util.CodeFormatter;
import com.bv87.diemdanh.util.VietnamTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final long MAX_AVATAR_BYTES = 5L * 1024 * 1024;
    private static final Pattern AVATAR_DATA_URL = Pattern.compile(
            "^data:(image/(?:jpeg|png|gif|webp));base64,([A-Za-z0-9+/=]+)$",
            Pattern.CASE_INSENSITIVE);
    private static final Set<String> ALLOWED_AVATAR_MIME = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp");
    private static final int MAX_REGISTRY_PAGE_SIZE = 500;

    private final DepartmentRepository departmentRepository;
    private final DepartmentGroupRepository departmentGroupRepository;
    private final EmployeeRepository employeeRepository;
    private final AccountRepository accountRepository;
    private final EmployeeDepartmentAssignmentRepository assignmentRepository;
    private final EmployeeFingerprintRepository employeeFingerprintRepository;
    private final AuditService auditService;
    private final VietnamTimeService vietnamTimeService;
    private final StaffRankCatalogService staffRankCatalogService;
    private final StaffPositionCatalogService staffPositionCatalogService;

    private void assertAdmin(AuthUser authUser) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới được truy cập quản trị nâng cao");
        }
    }

    private void assertHead(AuthUser authUser) {
        if (!authUser.isHead()) {
            throw new AccessDeniedException("Chỉ Trưởng đơn vị mới được truy cập");
        }
    }

    private Integer requireHeadDeptCode(AuthUser authUser) {
        assertHead(authUser);
        Integer deptCode = authUser.getDeptCode();
        if (deptCode == null) {
            throw new BusinessException("Tài khoản trưởng phòng chưa được gán Đơn vị");
        }
        return deptCode;
    }

    public AdminStatsDto getStats(AuthUser authUser) {
        assertAdmin(authUser);
        long totalStaff = employeeRepository.count();
        long activeStaff = employeeRepository.countByActiveTrue();
        int totalDepts = (int) departmentRepository.findAll().stream()
                .filter(Department::isActive)
                .count();
        double activePercent = totalStaff == 0 ? 0 : (activeStaff * 100.0 / totalStaff);

        return AdminStatsDto.builder()
                .totalDepartments(totalDepts)
                .totalStaff((int) totalStaff)
                .activeStaff((int) activeStaff)
                .activePercent(Math.round(activePercent * 10) / 10.0)
                .newDepartmentsThisMonth(0)
                .build();
    }

    public NextCodeDto getNextDeptCode(AuthUser authUser) {
        assertAdmin(authUser);
        int next = CodeAllocator.nextDeptCode(departmentRepository);
        return NextCodeDto.builder()
                .code(next)
                .codeFormatted(CodeFormatter.formatDeptCode(next))
                .build();
    }

    public NextCodeDto getNextEmpCode(AuthUser authUser, Integer deptCode) {
        assertAdmin(authUser);
        if (deptCode == null || !departmentRepository.existsById(deptCode)) {
            throw new BusinessException("Đơn vị không tồn tại");
        }
        int next = CodeAllocator.nextEmpCode(employeeRepository, deptCode);
        return NextCodeDto.builder()
                .code(next)
                .codeFormatted(CodeFormatter.formatEmpCode(next))
                .build();
    }

    public NextCodeDto getNextGroupCode(AuthUser authUser) {
        assertAdmin(authUser);
        int next = CodeAllocator.nextGroupCode(departmentGroupRepository);
        return NextCodeDto.builder()
                .code(next)
                .codeFormatted(CodeFormatter.formatGroupCode(next))
                .build();
    }

    public List<AdminDepartmentGroupDto> listDepartmentGroups(AuthUser authUser) {
        assertAdmin(authUser);
        return departmentGroupRepository.findAll().stream()
                .sorted(Comparator.comparing(DepartmentGroup::getSortOrder)
                        .thenComparing(DepartmentGroup::getGroupCode))
                .map(this::toDepartmentGroupDto)
                .toList();
    }

    @Transactional
    public AdminDepartmentGroupDto createDepartmentGroup(AuthUser authUser, DepartmentGroupUpsertRequest request) {
        assertAdmin(authUser);
        int groupCode = CodeAllocator.nextGroupCode(departmentGroupRepository);
        DepartmentGroup group = new DepartmentGroup();
        group.setGroupCode(groupCode);
        group.setGroupName(request.getGroupName().trim());
        group.setSortOrder(resolveGroupSortOrder(request.getSortOrder(), groupCode));
        return toDepartmentGroupDto(departmentGroupRepository.save(group));
    }

    @Transactional
    public AdminDepartmentGroupDto updateDepartmentGroup(
            AuthUser authUser, Integer groupCode, DepartmentGroupUpsertRequest request) {
        assertAdmin(authUser);
        DepartmentGroup group = requireDepartmentGroup(groupCode);
        group.setGroupName(request.getGroupName().trim());
        if (request.getSortOrder() != null) {
            group.setSortOrder(request.getSortOrder());
        }
        return toDepartmentGroupDto(departmentGroupRepository.save(group));
    }

    @Transactional
    public void deleteDepartmentGroup(AuthUser authUser, Integer groupCode) {
        assertAdmin(authUser);
        DepartmentGroup group = requireDepartmentGroup(groupCode);
        long deptCount = departmentRepository.countByDepartmentGroup_GroupCodeAndActiveTrue(groupCode);
        if (deptCount > 0) {
            throw new BusinessException("Không thể xóa nhóm còn " + deptCount + " Đơn vị");
        }
        group.setActive(false);
        departmentGroupRepository.save(group);
    }

    public List<AdminDepartmentDto> listDepartments(AuthUser authUser, Integer groupCode) {
        assertAdmin(authUser);
        return departmentRepository.findAllWithGroup().stream()
                .filter(d -> groupCode == null
                        || (d.getDepartmentGroup() != null
                        && groupCode.equals(d.getDepartmentGroup().getGroupCode())))
                .map(this::toDepartmentDto)
                .toList();
    }

    public AdminDepartmentDto getDepartment(AuthUser authUser, Integer deptCode) {
        assertAdmin(authUser);
        Department dept = departmentRepository.findByIdWithGroup(deptCode)
                .orElseThrow(() -> new BusinessException("Đơn vị không tồn tại"));
        return toDepartmentDto(dept);
    }

    @Transactional
    public AdminDepartmentDto createDepartment(AuthUser authUser, DepartmentUpsertRequest request) {
        assertAdmin(authUser);
        int deptCode = request.getDeptCode() != null
                ? request.getDeptCode()
                : CodeAllocator.nextDeptCode(departmentRepository);
        if (departmentRepository.existsById(deptCode)) {
            throw new BusinessException("Mã Đơn vị đã tồn tại");
        }
        validateHeadEmpCode(request.getHeadEmpCode(), deptCode);

        Department dept = new Department();
        dept.setDeptCode(deptCode);
        dept.setDeptName(request.getDeptName().trim());
        dept.setUnitCode(trimOrNull(request.getUnitCode()));
        dept.setDepartmentGroup(requireActiveDepartmentGroup(request.getGroupCode()));
        dept.setLocation(trimOrNull(request.getLocation()));
        dept.setHeadEmpCode(request.getHeadEmpCode());
        applyLocationImageUrl(dept, request.getLocationImageUrl());
        return toDepartmentDto(departmentRepository.save(dept));
    }

    @Transactional
    public AdminDepartmentDto updateDepartment(AuthUser authUser, Integer deptCode, DepartmentUpsertRequest request) {
        assertAdmin(authUser);
        Department dept = departmentRepository.findById(deptCode)
                .orElseThrow(() -> new BusinessException("Đơn vị không tồn tại"));
        validateHeadEmpCode(request.getHeadEmpCode(), deptCode);

        dept.setDeptName(request.getDeptName().trim());
        dept.setUnitCode(trimOrNull(request.getUnitCode()));
        dept.setDepartmentGroup(requireActiveDepartmentGroup(request.getGroupCode()));
        dept.setLocation(trimOrNull(request.getLocation()));
        dept.setHeadEmpCode(request.getHeadEmpCode());
        applyLocationImageUrl(dept, request.getLocationImageUrl());
        return toDepartmentDto(departmentRepository.save(dept));
    }

    @Transactional
    public void deleteDepartment(AuthUser authUser, Integer deptCode) {
        assertAdmin(authUser);
        Department dept = departmentRepository.findById(deptCode)
                .orElseThrow(() -> new BusinessException("Đơn vị không tồn tại"));
        if (!dept.isActive()) {
            throw new BusinessException("Đơn vị đã được xóa");
        }
        long staffCount = employeeRepository.countByDeptCode(deptCode);
        if (staffCount > 0) {
            throw new BusinessException("Không thể xóa Đơn vị còn " + staffCount + " Nhân viên");
        }
        dept.setActive(false);
        departmentRepository.save(dept);
    }

    public RegistryPageDto<AdminStaffDto> listStaffPage(
            AuthUser authUser, String search, Integer deptCode, int page, int pageSize) {
        assertAdmin(authUser);
        validateRegistryPage(page, pageSize);
        String q = normalizeRegistrySearch(search);
        PageRequest pageable = PageRequest.of(page - 1, pageSize, Sort.by("empCode"));
        Page<Employee> result = employeeRepository.searchPage(deptCode, q, pageable);
        Map<Integer, String> fpLabels = fingerprintLabelsByEmpCode(result.getContent());
        List<AdminStaffDto> items = result.getContent().stream()
                .map(emp -> toStaffDto(emp, fpLabels))
                .toList();
        return RegistryPageDto.<AdminStaffDto>builder()
                .items(items)
                .page(page)
                .pageSize(pageSize)
                .totalItems(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }

    public List<AdminStaffDto> listStaff(AuthUser authUser, String search, Integer deptCode) {
        return listStaffPage(authUser, search, deptCode, 1, MAX_REGISTRY_PAGE_SIZE).getItems();
    }

    public AdminStaffDto getStaff(AuthUser authUser, Integer empCode) {
        assertAdmin(authUser);
        Employee emp = employeeRepository.findByEmpCodeWithDept(empCode)
                .orElseThrow(() -> new BusinessException("Nhân viên không tồn tại"));
        return toStaffDto(emp);
    }

    public List<StaffDepartmentAssignmentDto> listStaffDepartmentHistory(AuthUser authUser, Integer empCode) {
        assertAdmin(authUser);
        if (!employeeRepository.existsById(empCode)) {
            throw new BusinessException("Nhân viên không tồn tại");
        }
        return assignmentRepository.findByEmpCodeOrderByFromDateDescIdDesc(empCode).stream()
                .map(this::toAssignmentDto)
                .toList();
    }

    @Transactional
    public AdminStaffDto createStaff(AuthUser authUser, StaffUpsertRequest request) {
        assertAdmin(authUser);
        Department dept = departmentRepository.findById(request.getDeptCode())
                .orElseThrow(() -> new BusinessException("Đơn vị không tồn tại"));
        if (!dept.isActive()) {
            throw new BusinessException("Không thể thêm nhân viên vào Đơn vị đã ngưng hoạt động");
        }
        staffRankCatalogService.validateActiveRankName(trimOrNull(request.getRankName()));
        staffPositionCatalogService.validateActivePositionName(trimOrNull(request.getPositionName()));

        int empCode = request.getEmpCode() != null
                ? request.getEmpCode()
                : CodeAllocator.nextEmpCode(employeeRepository, request.getDeptCode());
        if (employeeRepository.existsById(empCode)) {
            throw new BusinessException("Mã nhân viên đã tồn tại");
        }

        Employee emp = new Employee();
        emp.setEmpCode(empCode);
        emp.setFullname(request.getFullname().trim());
        emp.setDepartment(dept);
        emp.setRankName(trimOrNull(request.getRankName()));
        emp.setPositionName(trimOrNull(request.getPositionName()));
        emp.setActive(request.getActive() == null || request.getActive());
        applyAvatarUrl(emp, request.getAvatarUrl());
        Employee saved = employeeRepository.save(emp);
        recordDepartmentAssignment(authUser, empCode, dept.getDeptCode(), null);
        return toStaffDto(saved);
    }

    @Transactional
    public AdminStaffDto updateStaff(AuthUser authUser, Integer empCode, StaffUpsertRequest request) {
        assertAdmin(authUser);
        Employee emp = employeeRepository.findByEmpCodeWithDept(empCode)
                .orElseThrow(() -> new BusinessException("Nhân viên không tồn tại"));
        Department dept = departmentRepository.findById(request.getDeptCode())
                .orElseThrow(() -> new BusinessException("Đơn vị không tồn tại"));

        Integer oldDeptCode = emp.getDepartment().getDeptCode();
        Integer newDeptCode = request.getDeptCode();
        if (!oldDeptCode.equals(newDeptCode)) {
            transferStaffDepartment(authUser, empCode, oldDeptCode, newDeptCode, dept, request);
        }

        validateStaffAccountConstraints(emp, request);
        staffRankCatalogService.validateActiveRankName(trimOrNull(request.getRankName()));
        staffPositionCatalogService.validateActivePositionName(trimOrNull(request.getPositionName()));
        emp.setFullname(request.getFullname().trim());
        emp.setDepartment(dept);
        emp.setRankName(trimOrNull(request.getRankName()));
        emp.setPositionName(trimOrNull(request.getPositionName()));
        if (request.getActive() != null) {
            emp.setActive(request.getActive());
        }
        applyAvatarUrl(emp, request.getAvatarUrl());
        return toStaffDto(employeeRepository.save(emp));
    }

    @Transactional
    public void deleteStaff(AuthUser authUser, Integer empCode) {
        assertAdmin(authUser);
        if (!employeeRepository.existsById(empCode)) {
            throw new BusinessException("Nhân viên không tồn tại");
        }
        if (accountRepository.existsByEmployee_EmpCode(empCode)) {
            throw new BusinessException(
                    "Không thể xóa nhân viên đang được gắn với tài khoản đăng nhập. "
                            + "Hãy xóa hoặc đổi nhân viên trên tài khoản trước.");
        }
        if (departmentRepository.existsByHeadEmpCode(empCode)) {
            throw new BusinessException(
                    "Không thể xóa nhân viên đang được gán là Trưởng đơn vị trên danh mục Đơn vị.");
        }
        assignmentRepository.deleteByEmpCode(empCode);
        employeeRepository.deleteById(empCode);
    }

    public List<AdminStaffDto> listStaffForHead(AuthUser authUser, String search) {
        Integer deptCode = requireHeadDeptCode(authUser);
        List<Employee> employees = employeeRepository.findByDeptCode(deptCode).stream()
                .filter(Employee::isActive)
                .filter(e -> matchesSearch(e, search))
                .sorted(Comparator.comparing(Employee::getEmpCode))
                .toList();
        Map<Integer, String> fpLabels = fingerprintLabelsByEmpCode(employees);
        return employees.stream()
                .map(emp -> toStaffDto(emp, fpLabels))
                .toList();
    }

    public AdminStatsDto getStaffStatsForHead(AuthUser authUser) {
        Integer deptCode = requireHeadDeptCode(authUser);
        List<Employee> employees = employeeRepository.findByDeptCode(deptCode);
        long totalStaff = employees.size();
        long activeStaff = employees.stream().filter(Employee::isActive).count();
        double activePercent = totalStaff == 0 ? 0 : (activeStaff * 100.0 / totalStaff);

        return AdminStatsDto.builder()
                .totalDepartments(1)
                .totalStaff((int) totalStaff)
                .activeStaff((int) activeStaff)
                .activePercent(Math.round(activePercent * 10) / 10.0)
                .newDepartmentsThisMonth(0)
                .build();
    }

    @Transactional
    public AdminStaffDto updateStaffAvatarForHead(AuthUser authUser, Integer empCode, String avatarUrl) {
        Integer deptCode = requireHeadDeptCode(authUser);
        Employee emp = employeeRepository.findByEmpCodeWithDept(empCode)
                .orElseThrow(() -> new BusinessException("Nhân viên không tồn tại"));
        if (!emp.getDepartment().getDeptCode().equals(deptCode)) {
            throw new AccessDeniedException("Không được chỉnh sửa nhân viên Đơn vị khác");
        }
        applyAvatarUrl(emp, avatarUrl);
        return toStaffDto(employeeRepository.save(emp));
    }

    private AdminDepartmentDto toDepartmentDto(Department dept) {
        String headName = null;
        String headRank = null;
        String headEmpFormatted = null;
        if (dept.getHeadEmpCode() != null) {
            headEmpFormatted = CodeFormatter.formatEmpCode(dept.getHeadEmpCode());
            var headOpt = employeeRepository.findById(dept.getHeadEmpCode());
            if (headOpt.isPresent()) {
                Employee head = headOpt.get();
                headName = head.getFullname();
                headRank = head.getRankName();
            }
        }

        return AdminDepartmentDto.builder()
                .deptCode(dept.getDeptCode())
                .deptCodeFormatted(CodeFormatter.formatDeptCode(dept.getDeptCode()))
                .groupCode(dept.getDepartmentGroup().getGroupCode())
                .groupCodeFormatted(CodeFormatter.formatGroupCode(dept.getDepartmentGroup().getGroupCode()))
                .groupName(dept.getDepartmentGroup().getGroupName())
                .deptName(dept.getDeptName())
                .deptNameDisplay(resolveDeptNameDisplay(dept.getDeptName(), dept.getUnitCode()))
                .unitCode(dept.getUnitCode())
                .location(dept.getLocation())
                .locationImageUrl(dept.getLocationImageUrl())
                .headEmpCode(dept.getHeadEmpCode())
                .headEmpCodeFormatted(headEmpFormatted)
                .headName(headName)
                .headRank(headRank)
                .staffCount(employeeRepository.countByDeptCode(dept.getDeptCode()))
                .active(dept.isActive())
                .build();
    }

    private String resolveDeptNameDisplay(String deptName, String unitCode) {
        if (deptName == null) return null;
        String name = deptName.trim();
        if (unitCode == null || unitCode.isBlank()) return name;
        String uc = unitCode.trim();
        // Remove trailing "(<unitCode>)" with optional spaces, only when it matches the configured unitCode.
        String regex = "\\s*\\(\\s*" + Pattern.quote(uc) + "\\s*\\)\\s*$";
        return name.replaceAll(regex, "").trim();
    }

    private Map<Integer, String> fingerprintLabelsByEmpCode(List<Employee> employees) {
        if (employees == null || employees.isEmpty()) {
            return Map.of();
        }
        List<Integer> codes = employees.stream().map(Employee::getEmpCode).toList();
        return employeeFingerprintRepository.findAllByActiveTrueAndEmpCodeIn(codes).stream()
                .collect(java.util.stream.Collectors.toMap(
                        EmployeeFingerprint::getEmpCode,
                        fp -> fp.getFingerLabel() != null ? fp.getFingerLabel() : "",
                        (a, b) -> a));
    }

    private AdminStaffDto toStaffDto(Employee emp) {
        return toStaffDto(emp, null);
    }

    private AdminStaffDto toStaffDto(Employee emp, Map<Integer, String> fingerprintLabels) {
        Department dept = emp.getDepartment();
        List<Account> linkedAccounts = accountRepository.findAllByEmployee_EmpCode(emp.getEmpCode());
        var activeHeadAccount = linkedAccounts.stream()
                .filter(a -> a.getRole() == AccountRole.HEAD && a.isActive())
                .findFirst();
        boolean catalogHead = departmentRepository.existsByHeadEmpCode(emp.getEmpCode());
        String fingerLabel = null;
        boolean fingerprintRegistered;
        if (fingerprintLabels != null) {
            fingerprintRegistered = fingerprintLabels.containsKey(emp.getEmpCode());
            if (fingerprintRegistered) {
                String label = fingerprintLabels.get(emp.getEmpCode());
                fingerLabel = (label != null && !label.isBlank()) ? label : null;
            }
        } else {
            var fp = employeeFingerprintRepository.findFirstByEmpCodeAndActiveTrue(emp.getEmpCode());
            fingerprintRegistered = fp.isPresent();
            fingerLabel = fp.map(EmployeeFingerprint::getFingerLabel).orElse(null);
        }

        return AdminStaffDto.builder()
                .empCode(emp.getEmpCode())
                .empCodeFormatted(CodeFormatter.formatEmpCode(emp.getEmpCode()))
                .fullname(emp.getFullname())
                .deptCode(dept.getDeptCode())
                .deptCodeFormatted(CodeFormatter.formatDeptCode(dept.getDeptCode()))
                .deptName(dept.getDeptName())
                .rankName(emp.getRankName())
                .positionName(emp.getPositionName())
                .active(emp.isActive())
                .avatarUrl(emp.getAvatarUrl())
                .hasActiveHeadAccount(activeHeadAccount.isPresent())
                .isDepartmentCatalogHead(catalogHead)
                .headAccountUsername(activeHeadAccount.map(Account::getUsername).orElse(null))
                .fingerprintRegistered(fingerprintRegistered)
                .fingerLabel(fingerLabel)
                .build();
    }

    private void applyLocationImageUrl(Department dept, String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            dept.setLocationImageUrl(null);
            return;
        }
        dept.setLocationImageUrl(validateImageDataUrl(imageUrl));
    }

    private void applyAvatarUrl(Employee emp, String avatarUrl) {
        if (avatarUrl == null || avatarUrl.isBlank()) {
            emp.setAvatarUrl(null);
            return;
        }
        emp.setAvatarUrl(validateImageDataUrl(avatarUrl));
    }

    private String validateImageDataUrl(String imageUrl) {
        Matcher matcher = AVATAR_DATA_URL.matcher(imageUrl.trim());
        if (!matcher.matches()) {
            throw new BusinessException(
                    "Ảnh không hợp lệ. Chỉ chấp nhận JPG, PNG, GIF hoặc WEBP (tối đa 5MB).");
        }
        String mime = matcher.group(1).toLowerCase();
        if (!ALLOWED_AVATAR_MIME.contains(mime)) {
            throw new BusinessException("Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận JPG, PNG, GIF hoặc WEBP.");
        }
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(matcher.group(2));
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Không đọc được dữ liệu ảnh. Vui lòng tải lên lại.");
        }
        if (bytes.length == 0) {
            throw new BusinessException("Tệp ảnh rỗng hoặc không hợp lệ.");
        }
        if (bytes.length > MAX_AVATAR_BYTES) {
            throw new BusinessException("Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.");
        }
        return imageUrl.trim();
    }

    private void validateStaffAccountConstraints(Employee emp, StaffUpsertRequest request) {
        List<Account> linkedAccounts = accountRepository.findAllByEmployee_EmpCode(emp.getEmpCode());
        if (linkedAccounts.isEmpty()) {
            return;
        }
        if (request.getActive() != null && !request.getActive() && emp.isActive()) {
            throw new BusinessException(
                    "Không thể ngưng hoạt động nhân viên đang được gắn với tài khoản đăng nhập.");
        }
        if (!emp.getDepartment().getDeptCode().equals(request.getDeptCode())
                && linkedAccounts.stream().anyMatch(a -> a.getRole() == AccountRole.HEAD && a.isActive())) {
            throw new BusinessException(
                    "Nhân viên đang có tài khoản Trưởng đơn vị đang hoạt động. "
                            + "Vui lòng tick xác nhận thu hồi quyền Trưởng đơn vị khi luân chuyển.");
        }
    }

    private void validateHeadEmpCode(Integer headEmpCode, Integer deptCode) {
        if (headEmpCode == null) {
            return;
        }
        Department dept = departmentRepository.findById(deptCode)
                .orElseThrow(() -> new BusinessException("Đơn vị không tồn tại"));
        if (!dept.isActive()) {
            throw new BusinessException("Không thể gán TRƯỞNG cho Đơn vị đã ngưng hoạt động");
        }
        Employee head = employeeRepository.findByEmpCodeWithDept(headEmpCode)
                .orElseThrow(() -> new BusinessException("Trưởng đơn vị không tồn tại"));
        if (!head.isActive()) {
            throw new BusinessException("Trưởng đơn vị phải là nhân viên đang hoạt động");
        }
        if (!head.getDepartment().getDeptCode().equals(deptCode)) {
            throw new BusinessException("Trưởng đơn vị phải thuộc cùng Đơn vị");
        }
    }

    private void transferStaffDepartment(
            AuthUser authUser,
            Integer empCode,
            Integer oldDeptCode,
            Integer newDeptCode,
            Department targetDept,
            StaffUpsertRequest request) {
        String reason = trimOrNull(request.getTransferReason());
        if (reason == null) {
            throw new BusinessException("Vui lòng nhập lý do luân chuyển Đơn vị");
        }
        if (!targetDept.isActive()) {
            throw new BusinessException("Không thể luân chuyển sang Đơn vị đã ngưng hoạt động");
        }
        boolean headRevoked = requiresHeadRevokeOnTransfer(empCode);
        if (headRevoked) {
            if (!Boolean.TRUE.equals(request.getRevokeHeadOnTransfer())) {
                throw new BusinessException(
                        "Nhân viên đang là Trưởng đơn vị. "
                                + "Vui lòng tick xác nhận thu hồi quyền Trưởng đơn vị tại đơn vị cũ khi luân chuyển.");
            }
            revokeHeadRoleOnTransfer(authUser, empCode, oldDeptCode);
        }

        LocalDate today = vietnamTimeService.today();
        closeCurrentAssignment(empCode, today);
        recordDepartmentAssignment(authUser, empCode, newDeptCode, reason);
        auditService.log(authUser, "STAFF_DEPT_TRANSFER", Map.of(
                "empCode", empCode,
                "fromDeptCode", oldDeptCode,
                "toDeptCode", newDeptCode,
                "reason", reason,
                "headRevoked", headRevoked));
    }

    private boolean requiresHeadRevokeOnTransfer(Integer empCode) {
        if (departmentRepository.existsByHeadEmpCode(empCode)) {
            return true;
        }
        return accountRepository.findAllByEmployee_EmpCode(empCode).stream()
                .anyMatch(a -> a.getRole() == AccountRole.HEAD && a.isActive());
    }

    private void revokeHeadRoleOnTransfer(AuthUser authUser, Integer empCode, Integer oldDeptCode) {
        clearDepartmentHeadIfMatches(oldDeptCode, empCode);
        departmentRepository.findByHeadEmpCode(empCode).ifPresent(dept -> {
            if (empCode.equals(dept.getHeadEmpCode())) {
                dept.setHeadEmpCode(null);
                departmentRepository.save(dept);
            }
        });

        List<String> deactivatedUsernames = accountRepository.findAllByEmployee_EmpCode(empCode).stream()
                .filter(a -> a.getRole() == AccountRole.HEAD && a.isActive())
                .map(account -> {
                    Integer accountDeptCode = account.getDeptCode();
                    account.setActive(false);
                    accountRepository.save(account);
                    if (accountDeptCode != null) {
                        clearDepartmentHeadIfMatches(accountDeptCode, empCode);
                    }
                    return account.getUsername();
                })
                .toList();

        auditService.log(authUser, "STAFF_HEAD_REVOKED_ON_TRANSFER", Map.of(
                "empCode", empCode,
                "fromDeptCode", oldDeptCode,
                "deactivatedAccounts", deactivatedUsernames));
    }

    private void clearDepartmentHeadIfMatches(Integer deptCode, Integer empCode) {
        departmentRepository.findById(deptCode).ifPresent(dept -> {
            if (empCode.equals(dept.getHeadEmpCode())) {
                dept.setHeadEmpCode(null);
                departmentRepository.save(dept);
            }
        });
    }

    private void recordDepartmentAssignment(
            AuthUser authUser, Integer empCode, Integer deptCode, String reason) {
        EmployeeDepartmentAssignment row = new EmployeeDepartmentAssignment();
        row.setEmpCode(empCode);
        row.setDeptCode(deptCode);
        row.setFromDate(vietnamTimeService.today());
        row.setReason(trimOrNull(reason));
        row.setCreatedBy(authUser.getUsername());
        assignmentRepository.save(row);
    }

    private void closeCurrentAssignment(Integer empCode, LocalDate endDate) {
        assignmentRepository.findFirstByEmpCodeAndToDateIsNullOrderByFromDateDesc(empCode)
                .ifPresent(row -> {
                    row.setToDate(endDate);
                    assignmentRepository.save(row);
                });
    }

    private StaffDepartmentAssignmentDto toAssignmentDto(EmployeeDepartmentAssignment row) {
        Department dept = departmentRepository.findById(row.getDeptCode()).orElse(null);
        String deptName = dept != null ? dept.getDeptName() : "—";
        LocalDateTime createdAt = row.getCreatedAt() != null
                ? LocalDateTime.ofInstant(row.getCreatedAt(), VietnamTimeService.ZONE)
                : null;
        return StaffDepartmentAssignmentDto.builder()
                .id(row.getId())
                .deptCode(row.getDeptCode())
                .deptCodeFormatted(CodeFormatter.formatDeptCode(row.getDeptCode()))
                .deptName(deptName)
                .fromDate(row.getFromDate())
                .toDate(row.getToDate())
                .reason(row.getReason())
                .createdBy(row.getCreatedBy())
                .createdAt(createdAt)
                .current(row.getToDate() == null)
                .build();
    }

    private boolean matchesSearch(Employee e, String search) {
        if (search == null || search.isBlank()) return true;
        String q = search.toLowerCase().trim();
        return e.getFullname().toLowerCase().contains(q)
                || String.valueOf(e.getEmpCode()).contains(q)
                || CodeFormatter.formatEmpCode(e.getEmpCode()).contains(q);
    }

    private void validateRegistryPage(int page, int pageSize) {
        if (page < 1) {
            throw new BusinessException("Số trang không hợp lệ");
        }
        if (pageSize < 1 || pageSize > MAX_REGISTRY_PAGE_SIZE) {
            throw new BusinessException("Kích thước trang không hợp lệ");
        }
    }

    private String normalizeRegistrySearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        return search.trim();
    }

    private String trimOrNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private DepartmentGroup requireDepartmentGroup(Integer groupCode) {
        return departmentGroupRepository.findById(groupCode)
                .orElseThrow(() -> new BusinessException("Nhóm Đơn vị không tồn tại"));
    }

    private DepartmentGroup requireActiveDepartmentGroup(Integer groupCode) {
        DepartmentGroup group = requireDepartmentGroup(groupCode);
        if (!group.isActive()) {
            throw new BusinessException("Nhóm Đơn vị đã được xóa");
        }
        return group;
    }

    private int resolveGroupSortOrder(Integer requested, int groupCode) {
        if (requested != null) {
            return requested;
        }
        return departmentGroupRepository.findAll().stream()
                .mapToInt(DepartmentGroup::getSortOrder)
                .max()
                .orElse(0) + 1;
    }

    private AdminDepartmentGroupDto toDepartmentGroupDto(DepartmentGroup group) {
        return AdminDepartmentGroupDto.builder()
                .groupCode(group.getGroupCode())
                .groupCodeFormatted(CodeFormatter.formatGroupCode(group.getGroupCode()))
                .groupName(group.getGroupName())
                .sortOrder(group.getSortOrder())
                .deptCount(departmentRepository.countByDepartmentGroup_GroupCodeAndActiveTrue(group.getGroupCode()))
                .active(group.isActive())
                .build();
    }
}
