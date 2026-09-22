package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.PermissionGroupDto;
import com.bv87.diemdanh.dto.PermissionGroupUpsertRequest;
import com.bv87.diemdanh.entity.Account;
import com.bv87.diemdanh.entity.AccountRole;
import com.bv87.diemdanh.entity.PermissionGroup;
import com.bv87.diemdanh.entity.PermissionGroupScreen;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.AccountRepository;
import com.bv87.diemdanh.repository.PermissionGroupRepository;
import com.bv87.diemdanh.repository.PermissionGroupScreenRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.security.ScreenCatalog;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Named permission groups — SPEC_DUTY §7.1 / SPEC_ADMIN §8.2 (role inferred from screens).
 */
@Service
@RequiredArgsConstructor
public class PermissionGroupService {

    private final PermissionGroupRepository groupRepository;
    private final PermissionGroupScreenRepository groupScreenRepository;
    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public List<PermissionGroupDto> list(AuthUser authUser, String role, boolean activeOnly) {
        requireAdmin(authUser);
        AccountRole roleFilter = parseRole(role);
        return groupRepository.findFiltered(roleFilter, activeOnly).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PermissionGroupDto get(AuthUser authUser, Long id) {
        requireAdmin(authUser);
        PermissionGroup group = groupRepository.findByIdWithScreens(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy nhóm quyền"));
        return toDto(group);
    }

    @Transactional
    public PermissionGroupDto create(AuthUser authUser, PermissionGroupUpsertRequest request) {
        requireAdmin(authUser);
        String name = normalizeName(request.getName());
        Set<String> screens = normalizeScreens(request.getScreenCodes());
        AccountRole scope = inferScope(screens);

        if (groupRepository.existsByName(name)) {
            throw new BusinessException("Tên nhóm quyền đã tồn tại");
        }

        PermissionGroup group = new PermissionGroup();
        group.setName(name);
        group.setRoleScope(scope);
        group.setActive(request.getActive() == null || request.getActive());
        PermissionGroup saved = groupRepository.save(group);
        persistScreens(saved, screens);
        return toDto(groupRepository.findByIdWithScreens(saved.getId()).orElse(saved));
    }

    @Transactional
    public PermissionGroupDto update(AuthUser authUser, Long id, PermissionGroupUpsertRequest request) {
        requireAdmin(authUser);
        PermissionGroup group = groupRepository.findByIdWithScreens(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy nhóm quyền"));

        String name = normalizeName(request.getName());
        Set<String> screens = normalizeScreens(request.getScreenCodes());
        AccountRole scope = inferScope(screens);

        if (groupRepository.existsByNameAndIdNot(name, id)) {
            throw new BusinessException("Tên nhóm quyền đã tồn tại");
        }

        AccountRole oldScope = group.getRoleScope();
        group.setName(name);
        group.setRoleScope(scope);
        if (request.getActive() != null) {
            group.setActive(request.getActive());
        }
        groupRepository.save(group);
        persistScreens(group, screens);

        if (oldScope != scope) {
            syncAccountsRole(group, scope);
        }
        return toDto(groupRepository.findByIdWithScreens(id).orElse(group));
    }

    @Transactional
    public void deactivate(AuthUser authUser, Long id) {
        requireAdmin(authUser);
        PermissionGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Không tìm thấy nhóm quyền"));
        if (!group.isActive()) {
            throw new BusinessException("Nhóm quyền đã ngưng hoạt động");
        }
        group.setActive(false);
        groupRepository.save(group);
    }

    private void syncAccountsRole(PermissionGroup group, AccountRole newScope) {
        List<Account> attached = accountRepository.findAllByPermissionGroup_Id(group.getId());
        for (Account account : attached) {
            if (newScope == AccountRole.HEAD || newScope == AccountRole.DUTY) {
                if (account.getEmployee() == null) {
                    throw new BusinessException(
                            "Không đổi nhóm sang "
                                    + newScope.getLabel()
                                    + ": tài khoản \""
                                    + account.getUsername()
                                    + "\" chưa gắn nhân viên");
                }
            }
            account.setRole(newScope);
            accountRepository.save(account);
        }
    }

    private void persistScreens(PermissionGroup group, Set<String> unique) {
        groupScreenRepository.deleteByGroupId(group.getId());
        List<PermissionGroupScreen> rows = new ArrayList<>();
        for (String code : unique) {
            PermissionGroupScreen row = new PermissionGroupScreen();
            row.setGroup(group);
            row.setScreenCode(code);
            rows.add(row);
        }
        groupScreenRepository.saveAll(rows);
    }

    private static Set<String> normalizeScreens(List<String> requested) {
        List<String> codes = requested != null ? requested : List.of();
        Set<String> unique = new LinkedHashSet<>();
        for (String code : codes) {
            if (code == null || code.isBlank()) {
                continue;
            }
            String trimmed = code.trim();
            if (!ScreenCatalog.exists(trimmed)) {
                throw new BusinessException("Màn hình không hợp lệ: " + trimmed);
            }
            unique.add(trimmed);
        }
        if (unique.isEmpty()) {
            throw new BusinessException("Chọn ít nhất một màn hình");
        }
        return unique;
    }

    private static AccountRole inferScope(Set<String> screens) {
        try {
            return ScreenCatalog.inferRoleScope(screens);
        } catch (IllegalArgumentException ex) {
            if ("mixed".equals(ex.getMessage())) {
                throw new BusinessException(
                        "Một nhóm quyền chỉ được chọn màn của một loại tài khoản "
                                + "(Quản trị / Trực ban / Trưởng đơn vị)");
            }
            throw new BusinessException("Danh sách màn hình không hợp lệ");
        }
    }

    private PermissionGroupDto toDto(PermissionGroup group) {
        List<String> codes = group.getScreens() == null || group.getScreens().isEmpty()
                ? groupScreenRepository.findCodesByGroupId(group.getId())
                : group.getScreens().stream()
                        .map(PermissionGroupScreen::getScreenCode)
                        .sorted()
                        .toList();
        long accountCount = accountRepository.countByPermissionGroup_Id(group.getId());
        return PermissionGroupDto.builder()
                .id(group.getId())
                .name(group.getName())
                .roleScope(group.getRoleScope().name())
                .roleScopeLabel(group.getRoleScope().getLabel())
                .active(group.isActive())
                .screenCodes(codes)
                .accountCount(accountCount)
                .build();
    }

    private static String normalizeName(String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessException("Tên nhóm quyền là bắt buộc");
        }
        return name.trim();
    }

    private static AccountRole parseRole(String role) {
        if (role == null || role.isBlank()) {
            return null;
        }
        try {
            return AccountRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Bộ lọc vai trò không hợp lệ");
        }
    }

    private static void requireAdmin(AuthUser authUser) {
        if (authUser == null || !authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin được quản lý nhóm quyền");
        }
    }
}
