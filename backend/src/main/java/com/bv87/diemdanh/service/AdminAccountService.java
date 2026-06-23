package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.AccountStatsDto;
import com.bv87.diemdanh.dto.AccountUpsertRequest;
import com.bv87.diemdanh.dto.AdminAccountDto;
import com.bv87.diemdanh.dto.RegistryPageDto;
import com.bv87.diemdanh.dto.ResetPasswordRequest;
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
import com.bv87.diemdanh.util.CodeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminAccountService {

    private static final int MAX_REGISTRY_PAGE_SIZE = 500;
    private static final String HEAD_DEPT_TAKEN_MESSAGE =
            "Đơn vị này đã có tài khoản Trưởng đơn vị. "
                    + "Vui lòng sửa hoặc xóa tài khoản hiện có trước khi tạo mới.";

    private final AccountRepository accountRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    private void assertAdmin(AuthUser authUser) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới được quản lý tài khoản");
        }
    }

    @Transactional(readOnly = true)
    public AccountStatsDto getAccountStats(AuthUser authUser) {
        assertAdmin(authUser);
        long total = accountRepository.count();
        long active = accountRepository.countByActiveTrue();
        return AccountStatsDto.builder()
                .total(total)
                .active(active)
                .inactive(total - active)
                .build();
    }

    @Transactional(readOnly = true)
    public RegistryPageDto<AdminAccountDto> listAccountsPage(
            AuthUser authUser,
            String search,
            String role,
            String status,
            int page,
            int pageSize) {
        assertAdmin(authUser);
        validateRegistryPage(page, pageSize);
        AccountRole roleFilter = parseRoleFilter(role);
        Boolean activeFilter = parseStatusFilter(status);
        String q = normalizeRegistrySearch(search);
        PageRequest pageable = PageRequest.of(page - 1, pageSize, Sort.by("username"));
        Page<Account> result = accountRepository.searchPage(roleFilter, activeFilter, q, pageable);
        List<AdminAccountDto> items = result.getContent().stream()
                .map(this::toDto)
                .toList();
        return RegistryPageDto.<AdminAccountDto>builder()
                .items(items)
                .page(page)
                .pageSize(pageSize)
                .totalItems(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminAccountDto> listAccounts(AuthUser authUser) {
        return listAccountsPage(authUser, null, null, null, 1, MAX_REGISTRY_PAGE_SIZE).getItems();
    }

    @Transactional
    public AdminAccountDto createAccount(AuthUser authUser, AccountUpsertRequest request) {
        assertAdmin(authUser);
        validateCreateRequest(request);
        String username = request.getUsername().trim();
        if (accountRepository.existsByUsername(username)) {
            throw new BusinessException("Tên đăng nhập đã tồn tại");
        }

        Account account = new Account();
        account.setUsername(username);
        account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        account.setRole(request.getRole());
        account.setActive(request.getActive() == null || request.getActive());
        applyRelations(account, request, null);

        Account saved = accountRepository.save(account);
        syncDepartmentHeadAfterAccountChange(saved, null, null, null);
        return toDto(saved);
    }

    @Transactional
    public AdminAccountDto updateAccount(AuthUser authUser, Long accountId, AccountUpsertRequest request) {
        assertAdmin(authUser);
        Account account = accountRepository.findByIdWithDepartment(accountId)
                .orElseThrow(() -> new BusinessException("Tài khoản không tồn tại"));

        String username = request.getUsername().trim();
        if (accountRepository.existsByUsernameAndIdNot(username, accountId)) {
            throw new BusinessException("Tên đăng nhập đã tồn tại");
        }

        account.setUsername(username);
        account.setRole(request.getRole());
        if (request.getActive() != null) {
            account.setActive(request.getActive());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        AccountRole oldRole = account.getRole();
        Integer oldDeptCode = account.getDeptCode();
        Integer oldEmpCode = account.getEmployee() != null ? account.getEmployee().getEmpCode() : null;

        applyRelations(account, request, accountId);

        Account saved = accountRepository.save(account);
        syncDepartmentHeadAfterAccountChange(saved, oldRole, oldDeptCode, oldEmpCode);
        return toDto(saved);
    }

    @Transactional
    public void resetPassword(AuthUser authUser, Long accountId, ResetPasswordRequest request) {
        assertAdmin(authUser);
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException("Xác nhận mật khẩu không khớp");
        }

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new BusinessException("Tài khoản không tồn tại"));

        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        accountRepository.save(account);
    }

    @Transactional
    public void deleteAccount(AuthUser authUser, Long accountId) {
        assertAdmin(authUser);
        if (authUser.getAccount().getId().equals(accountId)) {
            throw new BusinessException("Không thể xóa tài khoản đang đăng nhập");
        }
        Account account = accountRepository.findByIdWithDepartment(accountId)
                .orElseThrow(() -> new BusinessException("Tài khoản không tồn tại"));

        AccountRole oldRole = account.getRole();
        Integer oldDeptCode = account.getDeptCode();
        Integer oldEmpCode = account.getEmployee() != null ? account.getEmployee().getEmpCode() : null;

        accountRepository.deleteById(accountId);
        if (oldRole == AccountRole.HEAD && oldDeptCode != null && oldEmpCode != null) {
            clearDepartmentHeadIfMatches(oldDeptCode, oldEmpCode);
        }
    }

    private void validateCreateRequest(AccountUpsertRequest request) {
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BusinessException("Mật khẩu là bắt buộc khi tạo tài khoản");
        }
        if (request.getPassword().length() < 6) {
            throw new BusinessException("Mật khẩu phải có ít nhất 6 ký tự");
        }
    }

    private void applyRelations(Account account, AccountUpsertRequest request, Long accountId) {
        if (request.getRole() == AccountRole.HEAD) {
            Employee emp = resolveHeadEmployee(request);
            Department dept = emp.getDepartment();
            account.setEmployee(emp);
            account.setDepartment(dept);
            account.setFullname(emp.getFullname());
            validateHeadUniqueness(account, accountId, emp.getEmpCode(), dept.getDeptCode());
            return;
        }

        account.setDepartment(null);
        if (request.getEmpCode() != null) {
            Employee emp = employeeRepository.findByEmpCodeWithDept(request.getEmpCode())
                    .orElseThrow(() -> new BusinessException("Nhân viên liên kết không tồn tại"));
            if (!emp.isActive()) {
                throw new BusinessException("Nhân viên đã ngưng hoạt động");
            }
            account.setEmployee(emp);
            account.setFullname(emp.getFullname());
            if (account.isActive()
                    && accountRepository.existsActiveByEmpCodeExcludingId(emp.getEmpCode(), accountId)) {
                throw new BusinessException("Nhân viên này đã được gắn với tài khoản đang hoạt động");
            }
            return;
        }

        account.setEmployee(null);
        if (request.getFullname() == null || request.getFullname().isBlank()) {
            throw new BusinessException("Họ và tên là bắt buộc");
        }
        account.setFullname(request.getFullname().trim());
    }

    private Employee resolveHeadEmployee(AccountUpsertRequest request) {
        if (request.getEmpCode() == null) {
            throw new BusinessException("Trưởng phòng phải chọn nhân viên trong danh mục hành chính");
        }
        Employee emp = employeeRepository.findByEmpCodeWithDept(request.getEmpCode())
                .orElseThrow(() -> new BusinessException("Nhân viên không tồn tại trong danh mục"));
        if (!emp.isActive()) {
            throw new BusinessException("Nhân viên đã ngưng hoạt động, không thể cấp tài khoản trưởng phòng");
        }
        if (request.getDeptCode() != null
                && !emp.getDepartment().getDeptCode().equals(request.getDeptCode())) {
            throw new BusinessException("Đơn vị phải trùng với đơn vị của nhân viên đã chọn");
        }
        return emp;
    }

    private void syncDepartmentHeadAfterAccountChange(
            Account account, AccountRole oldRole, Integer oldDeptCode, Integer oldEmpCode) {
        if (oldRole == AccountRole.HEAD && oldDeptCode != null && oldEmpCode != null) {
            clearDepartmentHeadIfMatches(oldDeptCode, oldEmpCode);
        }

        if (account.getRole() != AccountRole.HEAD || !account.isActive()) {
            return;
        }

        Employee emp = account.getEmployee();
        Department dept = account.getDepartment();
        if (emp == null || dept == null) {
            return;
        }

        departmentRepository.findById(dept.getDeptCode()).ifPresent(d -> {
            d.setHeadEmpCode(emp.getEmpCode());
            departmentRepository.save(d);
        });
    }

    private void clearDepartmentHeadIfMatches(Integer deptCode, Integer empCode) {
        departmentRepository.findById(deptCode).ifPresent(dept -> {
            if (empCode != null && empCode.equals(dept.getHeadEmpCode())) {
                dept.setHeadEmpCode(null);
                departmentRepository.save(dept);
            }
        });
    }

    private void validateHeadUniqueness(Account account, Long accountId, Integer empCode, Integer deptCode) {
        if (accountRepository.existsHeadByDeptCodeExcludingId(AccountRole.HEAD, deptCode, accountId)) {
            throw new BusinessException(HEAD_DEPT_TAKEN_MESSAGE);
        }
        if (account.isActive()
                && accountRepository.existsActiveByEmpCodeExcludingId(empCode, accountId)) {
            throw new BusinessException("Nhân viên này đã được gắn với tài khoản đang hoạt động");
        }
    }

    private AdminAccountDto toDto(Account account) {
        Department dept = account.getDepartment();
        Employee emp = account.getEmployee();
        Integer deptCode = dept != null ? dept.getDeptCode() : null;
        Integer empCode = emp != null ? emp.getEmpCode() : null;

        return AdminAccountDto.builder()
                .id(account.getId())
                .username(account.getUsername())
                .fullname(account.getFullname())
                .role(account.getRole())
                .roleLabel(account.getRole().getLabel())
                .deptCode(deptCode)
                .deptCodeFormatted(deptCode != null ? CodeFormatter.formatDeptCode(deptCode) : null)
                .deptName(dept != null ? dept.getDeptName() : null)
                .empCode(empCode)
                .empCodeFormatted(empCode != null ? CodeFormatter.formatEmpCode(empCode) : null)
                .active(account.isActive())
                .build();
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

    private AccountRole parseRoleFilter(String role) {
        if (role == null || role.isBlank()) {
            return null;
        }
        try {
            return AccountRole.valueOf(role);
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Bộ lọc vai trò không hợp lệ");
        }
    }

    private Boolean parseStatusFilter(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        return switch (status) {
            case "active" -> true;
            case "inactive" -> false;
            default -> throw new BusinessException("Bộ lọc trạng thái không hợp lệ");
        };
    }
}
