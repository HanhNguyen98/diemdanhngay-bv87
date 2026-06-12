package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.*;
import com.bv87.diemdanh.entity.Account;
import com.bv87.diemdanh.entity.AccountRole;
import com.bv87.diemdanh.entity.Department;
import com.bv87.diemdanh.entity.Employee;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.AccountRepository;
import com.bv87.diemdanh.repository.DepartmentRepository;
import com.bv87.diemdanh.repository.EmployeeRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.util.CodeAllocator;
import com.bv87.diemdanh.util.CodeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Base64;
import java.util.Comparator;
import java.util.List;
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

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final AccountRepository accountRepository;

    private void assertAdmin(AuthUser authUser) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới được truy cập quản trị nâng cao");
        }
    }

    private void assertHead(AuthUser authUser) {
        if (!authUser.isHead()) {
            throw new AccessDeniedException("Chỉ Trưởng Đơn vị mới được truy cập");
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
        int totalDepts = (int) departmentRepository.count();
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

    public List<AdminDepartmentDto> listDepartments(AuthUser authUser) {
        assertAdmin(authUser);
        return departmentRepository.findAll().stream()
                .sorted(Comparator.comparing(Department::getDeptCode))
                .map(this::toDepartmentDto)
                .toList();
    }

    public AdminDepartmentDto getDepartment(AuthUser authUser, Integer deptCode) {
        assertAdmin(authUser);
        Department dept = departmentRepository.findById(deptCode)
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
        dept.setLocation(trimOrNull(request.getLocation()));
        dept.setHeadEmpCode(request.getHeadEmpCode());
        applyLocationImageUrl(dept, request.getLocationImageUrl());
        return toDepartmentDto(departmentRepository.save(dept));
    }

    @Transactional
    public void deleteDepartment(AuthUser authUser, Integer deptCode) {
        assertAdmin(authUser);
        if (!departmentRepository.existsById(deptCode)) {
            throw new BusinessException("Đơn vị không tồn tại");
        }
        long staffCount = employeeRepository.countByDeptCode(deptCode);
        if (staffCount > 0) {
            throw new BusinessException("Không thể xóa Đơn vị còn " + staffCount + " Nhân viên");
        }
        departmentRepository.deleteById(deptCode);
    }

    public List<AdminStaffDto> listStaff(AuthUser authUser, String search, Integer deptCode) {
        assertAdmin(authUser);
        return employeeRepository.findAllWithDepartment().stream()
                .filter(e -> deptCode == null || e.getDepartment().getDeptCode().equals(deptCode))
                .filter(e -> matchesSearch(e, search))
                .sorted(Comparator.comparing(Employee::getEmpCode))
                .map(this::toStaffDto)
                .toList();
    }

    public AdminStaffDto getStaff(AuthUser authUser, Integer empCode) {
        assertAdmin(authUser);
        Employee emp = employeeRepository.findByEmpCodeWithDept(empCode)
                .orElseThrow(() -> new BusinessException("Nhân viên không tồn tại"));
        return toStaffDto(emp);
    }

    @Transactional
    public AdminStaffDto createStaff(AuthUser authUser, StaffUpsertRequest request) {
        assertAdmin(authUser);
        Department dept = departmentRepository.findById(request.getDeptCode())
                .orElseThrow(() -> new BusinessException("Đơn vị không tồn tại"));

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
        return toStaffDto(employeeRepository.save(emp));
    }

    @Transactional
    public AdminStaffDto updateStaff(AuthUser authUser, Integer empCode, StaffUpsertRequest request) {
        assertAdmin(authUser);
        Employee emp = employeeRepository.findByEmpCodeWithDept(empCode)
                .orElseThrow(() -> new BusinessException("Nhân viên không tồn tại"));
        Department dept = departmentRepository.findById(request.getDeptCode())
                .orElseThrow(() -> new BusinessException("Đơn vị không tồn tại"));

        validateStaffAccountConstraints(emp, request);
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
                    "Không thể xóa nhân viên đang được gán là TRƯỞNG Đơn vị trên danh mục ĐƠN VỊ.");
        }
        employeeRepository.deleteById(empCode);
    }

    public List<AdminStaffDto> listStaffForHead(AuthUser authUser, String search) {
        Integer deptCode = requireHeadDeptCode(authUser);
        return employeeRepository.findByDeptCode(deptCode).stream()
                .filter(e -> matchesSearch(e, search))
                .sorted(Comparator.comparing(Employee::getEmpCode))
                .map(this::toStaffDto)
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
                .deptName(dept.getDeptName())
                .location(dept.getLocation())
                .locationImageUrl(dept.getLocationImageUrl())
                .headEmpCode(dept.getHeadEmpCode())
                .headEmpCodeFormatted(headEmpFormatted)
                .headName(headName)
                .headRank(headRank)
                .staffCount(employeeRepository.countByDeptCode(dept.getDeptCode()))
                .build();
    }

    private AdminStaffDto toStaffDto(Employee emp) {
        Department dept = emp.getDepartment();
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
                && linkedAccounts.stream().anyMatch(a -> a.getRole() == AccountRole.HEAD)) {
            throw new BusinessException(
                    "Không thể đổi Đơn vị vì nhân viên đang là Trưởng phòng trên hệ thống.");
        }
    }

    private void validateHeadEmpCode(Integer headEmpCode, Integer deptCode) {
        if (headEmpCode == null) return;
        Employee head = employeeRepository.findByEmpCodeWithDept(headEmpCode)
                .orElseThrow(() -> new BusinessException("TRƯỞNG Đơn vị không tồn tại"));
        if (!head.getDepartment().getDeptCode().equals(deptCode)) {
            throw new BusinessException("TRƯỞNG Đơn vị phải thuộc cùng Đơn vị");
        }
    }

    private boolean matchesSearch(Employee e, String search) {
        if (search == null || search.isBlank()) return true;
        String q = search.toLowerCase().trim();
        return e.getFullname().toLowerCase().contains(q)
                || String.valueOf(e.getEmpCode()).contains(q)
                || CodeFormatter.formatEmpCode(e.getEmpCode()).contains(q);
    }

    private String trimOrNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
