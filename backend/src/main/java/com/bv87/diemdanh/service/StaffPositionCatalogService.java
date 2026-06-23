package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.NextCodeDto;
import com.bv87.diemdanh.dto.StaffPositionDto;
import com.bv87.diemdanh.dto.StaffPositionUpsertRequest;
import com.bv87.diemdanh.entity.StaffPosition;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.EmployeeRepository;
import com.bv87.diemdanh.repository.StaffPositionRepository;
import com.bv87.diemdanh.security.AuthUser;
import com.bv87.diemdanh.util.CodeAllocator;
import com.bv87.diemdanh.util.CodeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Admin CRUD for staff position catalog entries. */
@Service
@RequiredArgsConstructor
public class StaffPositionCatalogService {

    private final StaffPositionRepository staffPositionRepository;
    private final EmployeeRepository employeeRepository;

    private void assertAdmin(AuthUser authUser) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới được quản lý danh mục chức vụ");
        }
    }

    @Transactional(readOnly = true)
    public NextCodeDto getNextCode(AuthUser authUser) {
        assertAdmin(authUser);
        int code = CodeAllocator.nextPositionCode(staffPositionRepository);
        return NextCodeDto.builder()
                .code(code)
                .codeFormatted(CodeFormatter.formatGroupCode(code))
                .build();
    }

    @Transactional(readOnly = true)
    public List<StaffPositionDto> listAll(AuthUser authUser) {
        assertAdmin(authUser);
        return staffPositionRepository.findAllOrdered().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StaffPositionDto> listActive() {
        return staffPositionRepository.findAllActiveOrdered().stream()
                .map(position -> toDto(position, 0))
                .toList();
    }

    @Transactional
    public StaffPositionDto create(AuthUser authUser, StaffPositionUpsertRequest request) {
        assertAdmin(authUser);
        String positionName = normalizeName(request.getPositionName());
        assertUniqueName(positionName, null);

        StaffPosition position = new StaffPosition();
        position.setPositionCode(CodeAllocator.nextPositionCode(staffPositionRepository));
        position.setPositionName(positionName);
        position.setSortOrder(resolveSortOrder(request.getSortOrder()));
        position.setActive(request.getActive() == null || request.getActive());
        return toDto(staffPositionRepository.save(position));
    }

    @Transactional
    public StaffPositionDto update(AuthUser authUser, Integer positionCode, StaffPositionUpsertRequest request) {
        assertAdmin(authUser);
        StaffPosition position = requirePosition(positionCode);
        String positionName = normalizeName(request.getPositionName());
        assertUniqueName(positionName, positionCode);

        position.setPositionName(positionName);
        if (request.getSortOrder() != null) {
            position.setSortOrder(request.getSortOrder());
        }
        if (request.getActive() != null) {
            position.setActive(request.getActive());
        }
        return toDto(staffPositionRepository.save(position));
    }

    @Transactional
    public void delete(AuthUser authUser, Integer positionCode) {
        assertAdmin(authUser);
        StaffPosition position = requirePosition(positionCode);
        long usage = employeeRepository.countByPositionName(position.getPositionName());
        if (usage > 0) {
            throw new BusinessException(
                    "Không thể xóa chức vụ đang được " + usage + " nhân viên sử dụng. "
                            + "Hãy chuyển sang Ngưng hoạt động.");
        }
        staffPositionRepository.delete(position);
    }

    /**
     * Validates position name against the active catalog when saving staff profiles.
     *
     * @param positionName nullable position name from staff form
     */
    @Transactional(readOnly = true)
    public void validateActivePositionName(String positionName) {
        if (positionName == null || positionName.isBlank()) {
            return;
        }
        StaffPosition position = staffPositionRepository.findByPositionName(positionName)
                .orElseThrow(() -> new BusinessException("Chức vụ không hợp lệ: " + positionName));
        if (!position.isActive()) {
            throw new BusinessException("Chức vụ \"" + position.getPositionName() + "\" đã ngưng sử dụng");
        }
    }

    private StaffPosition requirePosition(Integer positionCode) {
        return staffPositionRepository.findById(positionCode)
                .orElseThrow(() -> new BusinessException("Chức vụ không tồn tại"));
    }

    private void assertUniqueName(String positionName, Integer excludeCode) {
        staffPositionRepository.findByPositionName(positionName).ifPresent(existing -> {
            if (excludeCode == null || !excludeCode.equals(existing.getPositionCode())) {
                throw new BusinessException("Tên chức vụ đã tồn tại: " + positionName);
            }
        });
    }

    private String normalizeName(String value) {
        if (value == null || value.isBlank()) {
            throw new BusinessException("Tên chức vụ không được để trống");
        }
        return value.trim();
    }

    private int resolveSortOrder(Integer sortOrder) {
        if (sortOrder != null) {
            return sortOrder;
        }
        return staffPositionRepository.findAllOrdered().stream()
                .mapToInt(StaffPosition::getSortOrder)
                .max()
                .orElse(0) + 1;
    }

    private StaffPositionDto toDto(StaffPosition position) {
        return toDto(position, employeeRepository.countByPositionName(position.getPositionName()));
    }

    private StaffPositionDto toDto(StaffPosition position, long usageCount) {
        return StaffPositionDto.builder()
                .positionCode(position.getPositionCode())
                .positionCodeFormatted(CodeFormatter.formatGroupCode(position.getPositionCode()))
                .positionName(position.getPositionName())
                .sortOrder(position.getSortOrder())
                .active(position.isActive())
                .usageCount(usageCount)
                .build();
    }
}
