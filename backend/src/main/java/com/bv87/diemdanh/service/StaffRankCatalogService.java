package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.NextCodeDto;
import com.bv87.diemdanh.dto.StaffRankDto;
import com.bv87.diemdanh.dto.StaffRankUpsertRequest;
import com.bv87.diemdanh.entity.StaffRank;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.EmployeeRepository;
import com.bv87.diemdanh.repository.StaffRankRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.util.CodeAllocator;
import com.bv87.diemdanh.util.CodeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Admin CRUD for staff rank catalog entries. */
@Service
@RequiredArgsConstructor
public class StaffRankCatalogService {

    private final StaffRankRepository staffRankRepository;
    private final EmployeeRepository employeeRepository;

    private void assertAdmin(AuthUser authUser) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới được quản lý danh mục cấp bậc");
        }
    }

    @Transactional(readOnly = true)
    public NextCodeDto getNextCode(AuthUser authUser) {
        assertAdmin(authUser);
        int code = CodeAllocator.nextRankCode(staffRankRepository);
        return NextCodeDto.builder()
                .code(code)
                .codeFormatted(CodeFormatter.formatGroupCode(code))
                .build();
    }

    @Transactional(readOnly = true)
    public List<StaffRankDto> listAll(AuthUser authUser) {
        assertAdmin(authUser);
        return staffRankRepository.findAllOrdered().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StaffRankDto> listActive() {
        return staffRankRepository.findAllActiveOrdered().stream()
                .map(rank -> toDto(rank, 0))
                .toList();
    }

    @Transactional
    public StaffRankDto create(AuthUser authUser, StaffRankUpsertRequest request) {
        assertAdmin(authUser);
        String rankName = normalizeName(request.getRankName());
        assertUniqueName(rankName, null);

        StaffRank rank = new StaffRank();
        rank.setRankCode(CodeAllocator.nextRankCode(staffRankRepository));
        rank.setRankName(rankName);
        rank.setSortOrder(resolveSortOrder(request.getSortOrder()));
        rank.setActive(request.getActive() == null || request.getActive());
        return toDto(staffRankRepository.save(rank));
    }

    @Transactional
    public StaffRankDto update(AuthUser authUser, Integer rankCode, StaffRankUpsertRequest request) {
        assertAdmin(authUser);
        StaffRank rank = requireRank(rankCode);
        String rankName = normalizeName(request.getRankName());
        assertUniqueName(rankName, rankCode);

        rank.setRankName(rankName);
        if (request.getSortOrder() != null) {
            rank.setSortOrder(request.getSortOrder());
        }
        if (request.getActive() != null) {
            rank.setActive(request.getActive());
        }
        return toDto(staffRankRepository.save(rank));
    }

    @Transactional
    public void delete(AuthUser authUser, Integer rankCode) {
        assertAdmin(authUser);
        StaffRank rank = requireRank(rankCode);
        long usage = employeeRepository.countByRankName(rank.getRankName());
        if (usage > 0) {
            throw new BusinessException(
                    "Không thể xóa cấp bậc đang được " + usage + " nhân viên sử dụng. "
                            + "Hãy chuyển sang Ngưng hoạt động.");
        }
        staffRankRepository.delete(rank);
    }

    /**
     * Validates rank name against the active catalog when saving staff profiles.
     *
     * @param rankName nullable rank name from staff form
     */
    @Transactional(readOnly = true)
    public void validateActiveRankName(String rankName) {
        if (rankName == null || rankName.isBlank()) {
            return;
        }
        StaffRank rank = staffRankRepository.findByRankName(rankName)
                .orElseThrow(() -> new BusinessException("Cấp bậc không hợp lệ: " + rankName));
        if (!rank.isActive()) {
            throw new BusinessException("Cấp bậc \"" + rank.getRankName() + "\" đã ngưng sử dụng");
        }
    }

    /**
     * Validates rank against active catalog, or allows keeping the stored legacy name.
     *
     * @param rankName requested name (nullable)
     * @param currentStored name already on the employee row (nullable)
     */
    @Transactional(readOnly = true)
    public void validateActiveRankNameOrUnchanged(String rankName, String currentStored) {
        if (rankName == null || rankName.isBlank()) {
            return;
        }
        if (currentStored != null && rankName.equals(currentStored.trim())) {
            return;
        }
        validateActiveRankName(rankName);
    }

    private StaffRank requireRank(Integer rankCode) {
        return staffRankRepository.findById(rankCode)
                .orElseThrow(() -> new BusinessException("Cấp bậc không tồn tại"));
    }

    private void assertUniqueName(String rankName, Integer excludeCode) {
        staffRankRepository.findByRankName(rankName).ifPresent(existing -> {
            if (excludeCode == null || !excludeCode.equals(existing.getRankCode())) {
                throw new BusinessException("Tên cấp bậc đã tồn tại: " + rankName);
            }
        });
    }

    private String normalizeName(String value) {
        if (value == null || value.isBlank()) {
            throw new BusinessException("Tên cấp bậc không được để trống");
        }
        return value.trim();
    }

    private int resolveSortOrder(Integer sortOrder) {
        if (sortOrder != null) {
            return sortOrder;
        }
        return staffRankRepository.findAllOrdered().stream()
                .mapToInt(StaffRank::getSortOrder)
                .max()
                .orElse(0) + 1;
    }

    private StaffRankDto toDto(StaffRank rank) {
        return toDto(rank, employeeRepository.countByRankName(rank.getRankName()));
    }

    private StaffRankDto toDto(StaffRank rank, long usageCount) {
        return StaffRankDto.builder()
                .rankCode(rank.getRankCode())
                .rankCodeFormatted(CodeFormatter.formatGroupCode(rank.getRankCode()))
                .rankName(rank.getRankName())
                .sortOrder(rank.getSortOrder())
                .active(rank.isActive())
                .usageCount(usageCount)
                .build();
    }
}
