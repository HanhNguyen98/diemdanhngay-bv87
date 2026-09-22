package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.AccountScreensDto;
import com.bv87.diemdanh.dto.AccountScreensUpdateRequest;
import com.bv87.diemdanh.dto.ScreenCatalogItemDto;
import com.bv87.diemdanh.entity.Account;
import com.bv87.diemdanh.entity.AccountRole;
import com.bv87.diemdanh.entity.AccountScreen;
import com.bv87.diemdanh.entity.PermissionGroup;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.AccountRepository;
import com.bv87.diemdanh.repository.AccountScreenRepository;
import com.bv87.diemdanh.repository.PermissionGroupScreenRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.security.ScreenCatalog;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Account screen grants — SPEC_DUTY §7 / SPEC_ADMIN §8.1 / §7.1.
 */
@Service
@RequiredArgsConstructor
public class AccountScreenService {

    private final AccountScreenRepository screenRepository;
    private final AccountRepository accountRepository;
    private final PermissionGroupScreenRepository groupScreenRepository;

    @Transactional(readOnly = true)
    public List<ScreenCatalogItemDto> listCatalog(AuthUser authUser) {
        requireAdmin(authUser);
        Map<String, Long> counts = ScreenCatalog.labelCounts();
        List<ScreenCatalogItemDto> items = new ArrayList<>();
        for (ScreenCatalog.ScreenDef def : ScreenCatalog.allUnique()) {
            items.add(ScreenCatalogItemDto.builder()
                    .code(def.code())
                    .navId(def.navId())
                    .mode(def.mode())
                    .label(def.label())
                    .displayLabel(ScreenCatalog.displayLabel(def, counts))
                    .group(def.group())
                    .build());
        }
        return items;
    }

    @Transactional(readOnly = true)
    public AccountScreensDto getAccountScreens(AuthUser authUser, Long accountId) {
        requireAdmin(authUser);
        Account account = loadAccount(accountId);
        return buildDto(account);
    }

    @Transactional
    public AccountScreensDto replaceAccountScreens(
            AuthUser authUser, Long accountId, AccountScreensUpdateRequest request) {
        requireAdmin(authUser);
        Account account = loadAccount(accountId);
        Set<String> allowed = ScreenCatalog.allowedFor(account.getRole());
        List<String> requested = request.getScreenCodes() != null ? request.getScreenCodes() : List.of();

        // Custom screen edit clears group attachment (SPEC_DUTY §7.1)
        account.setPermissionGroup(null);
        accountRepository.save(account);

        if (requested.isEmpty()) {
            screenRepository.deleteByAccountId(accountId);
            return buildDto(loadAccount(accountId));
        }

        Set<String> unique = new LinkedHashSet<>();
        for (String code : requested) {
            if (code == null || code.isBlank()) {
                continue;
            }
            String trimmed = code.trim();
            if (!ScreenCatalog.exists(trimmed)) {
                throw new BusinessException("Màn hình không hợp lệ: " + trimmed);
            }
            if (!allowed.contains(trimmed)) {
                throw new BusinessException(
                        "Không được cấp màn \"" + trimmed + "\" cho vai trò "
                                + account.getRole().getLabel());
            }
            unique.add(trimmed);
        }

        screenRepository.deleteByAccountId(accountId);
        for (String code : unique) {
            AccountScreen row = new AccountScreen();
            row.setAccount(account);
            row.setScreenCode(code);
            screenRepository.save(row);
        }
        return buildDto(loadAccount(accountId));
    }

    @Transactional(readOnly = true)
    public List<String> effectiveScreenCodes(Account account) {
        // Bootstrap admin (no group) → full ADMIN defaults
        if (account.getRole() == AccountRole.ADMIN
                && account.getPermissionGroup() == null) {
            List<String> stored = screenRepository.findCodesByAccountId(account.getId());
            if (!stored.isEmpty()) {
                return stored;
            }
            return List.copyOf(ScreenCatalog.defaultsFor(AccountRole.ADMIN));
        }

        PermissionGroup group = account.getPermissionGroup();
        if (group != null && group.isActive()) {
            Set<String> allowed = ScreenCatalog.allowedFor(account.getRole());
            List<String> groupCodes = groupScreenRepository.findCodesByGroupId(group.getId());
            LinkedHashSet<String> effective = new LinkedHashSet<>();
            for (String code : groupCodes) {
                if (allowed.contains(code)) {
                    effective.add(code);
                }
            }
            if (!effective.isEmpty()) {
                return List.copyOf(effective);
            }
        }

        List<String> stored = screenRepository.findCodesByAccountId(account.getId());
        if (!stored.isEmpty()) {
            return stored;
        }
        return List.copyOf(ScreenCatalog.defaultsFor(account.getRole()));
    }

    @Transactional(readOnly = true)
    public boolean hasScreen(AuthUser authUser, String screenCode) {
        if (authUser == null || screenCode == null) {
            return false;
        }
        return effectiveScreenCodes(authUser.getAccount()).contains(screenCode);
    }

    private AccountScreensDto buildDto(Account account) {
        Long accountId = account.getId();
        PermissionGroup group = account.getPermissionGroup();
        List<String> stored = screenRepository.findCodesByAccountId(accountId);
        boolean usingGroup = group != null && group.isActive();
        boolean usingDefaults = !usingGroup && stored.isEmpty();
        List<String> effective = effectiveScreenCodes(account);

        return AccountScreensDto.builder()
                .accountId(accountId)
                .role(account.getRole().name())
                .usingDefaults(usingDefaults)
                .permissionGroupId(group != null ? group.getId() : null)
                .permissionGroupName(group != null ? group.getName() : null)
                .screenCodes(List.copyOf(effective))
                .allowedCodes(List.copyOf(ScreenCatalog.allowedFor(account.getRole())))
                .build();
    }

    private Account loadAccount(Long accountId) {
        return accountRepository.findByIdWithDepartment(accountId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy tài khoản"));
    }

    private static void requireAdmin(AuthUser authUser) {
        if (authUser == null || !authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin được cấu hình phân quyền màn hình");
        }
    }
}
