package com.bv87.diemdanh.service;

import com.bv87.diemdanh.dto.AttendanceStatusTypeDto;
import com.bv87.diemdanh.dto.AttendanceStatusTypeUpsertRequest;
import com.bv87.diemdanh.dto.StatusBreakdownItemDto;
import com.bv87.diemdanh.entity.AttendanceStatus;
import com.bv87.diemdanh.entity.AttendanceStatusType;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.AttendanceStatusTypeRepository;
import com.bv87.diemdanh.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceStatusCatalogService {

    private static final Set<String> ALLOWED_COLOR_KEYS = Set.of(
            "green", "red", "yellow", "blue", "teal", "purple", "amber");
    private static final Set<String> ALLOWED_ICON_KEYS = Set.of(
            "check", "x", "graduation", "briefcase", "clock", "plane", "pending",
            "baby", "sick", "late", "moon", "home");

    private final AttendanceStatusTypeRepository repository;

    private void assertAdmin(AuthUser authUser) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới được quản lý trạng thái làm việc");
        }
    }

    @Transactional(readOnly = true)
    public List<AttendanceStatusTypeDto> listAll(AuthUser authUser) {
        assertAdmin(authUser);
        return repository.findAllOrdered().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceStatusTypeDto> listActive() {
        return repository.findAllActiveOrdered().stream()
                .map(type -> toDto(type, 0))
                .toList();
    }

    @Transactional(readOnly = true)
    public AttendanceStatusTypeDto getById(AuthUser authUser, Long id) {
        assertAdmin(authUser);
        AttendanceStatusType type = repository.findById(id)
                .orElseThrow(() -> new BusinessException("Trạng thái không tồn tại"));
        return toDto(type);
    }

    @Transactional
    public AttendanceStatusTypeDto create(AuthUser authUser, AttendanceStatusTypeUpsertRequest request) {
        assertAdmin(authUser);
        validateRequest(request, null);
        String code = normalizeCode(request.getCode());

        if (repository.existsByCode(code)) {
            throw new BusinessException("Mã trạng thái đã tồn tại: " + code);
        }

        AttendanceStatusType type = new AttendanceStatusType();
        applyRequest(type, request, code);
        return toDto(repository.save(type));
    }

    @Transactional
    public AttendanceStatusTypeDto update(
            AuthUser authUser, Long id, AttendanceStatusTypeUpsertRequest request) {
        assertAdmin(authUser);
        AttendanceStatusType type = repository.findById(id)
                .orElseThrow(() -> new BusinessException("Trạng thái không tồn tại"));

        validateRequest(request, type.getCode());
        String code = type.getCode();
        if (!code.equals(normalizeCode(request.getCode()))) {
            throw new BusinessException("Không thể đổi mã trạng thái sau khi đã tạo");
        }

        applyRequest(type, request, code);
        return toDto(repository.save(type));
    }

    @Transactional
    public void delete(AuthUser authUser, Long id) {
        assertAdmin(authUser);
        AttendanceStatusType type = repository.findById(id)
                .orElseThrow(() -> new BusinessException("Trạng thái không tồn tại"));

        long usage = repository.countUsageByCode(type.getCode());
        if (usage > 0) {
            throw new BusinessException(
                    "Không thể xóa trạng thái đang được dùng trong " + usage + " bản ghi Điểm danh. "
                            + "Hãy chuyển sang Ngưng hoạt động.");
        }
        repository.delete(type);
    }

    @Transactional(readOnly = true)
    public void assertActiveStatus(String statusCode) {
        if (statusCode == null || statusCode.isBlank()) {
            throw new BusinessException("Trạng thái điểm danh không được để trống");
        }
        AttendanceStatusType type = repository.findByCode(statusCode)
                .orElseThrow(() -> new BusinessException("Trạng thái không hợp lệ: " + statusCode));
        if (!type.isActive()) {
            throw new BusinessException("Trạng thái \"" + type.getLabel() + "\" đã ngưng sử dụng");
        }
    }

    @Transactional(readOnly = true)
    public String resolveLabel(String statusCode) {
        if (statusCode == null) {
            return null;
        }
        return repository.findByCode(statusCode)
                .map(AttendanceStatusType::getLabel)
                .orElseGet(() -> {
                    try {
                        return AttendanceStatus.valueOf(statusCode).getLabel();
                    } catch (IllegalArgumentException ex) {
                        return statusCode;
                    }
                });
    }

    /** Gom số lượng theo mã trạng thái từ danh sách mã đã chấm. */
    public Map<String, Long> tallyStatusCodes(Iterable<String> statusCodes) {
        Map<String, Long> counts = new HashMap<>();
        if (statusCodes == null) {
            return counts;
        }
        for (String code : statusCodes) {
            if (code == null || code.isBlank()) {
                continue;
            }
            counts.merge(code, 1L, Long::sum);
        }
        return counts;
    }

    /** Dựng breakdown theo catalog active; trạng thái lạ trong DB vẫn được liệt kê cuối. */
    @Transactional(readOnly = true)
    public List<StatusBreakdownItemDto> buildBreakdown(Map<String, Long> countsByCode) {
        Map<String, Long> counts = countsByCode != null ? countsByCode : Map.of();
        List<AttendanceStatusType> activeTypes = repository.findAllActiveOrdered();
        List<StatusBreakdownItemDto> result = new ArrayList<>();
        Set<String> covered = activeTypes.stream()
                .map(AttendanceStatusType::getCode)
                .collect(Collectors.toSet());

        for (AttendanceStatusType type : activeTypes) {
            result.add(toBreakdownItem(type, counts.getOrDefault(type.getCode(), 0L)));
        }

        counts.entrySet().stream()
                .filter(e -> !covered.contains(e.getKey()))
                .sorted(Map.Entry.comparingByKey())
                .forEach(e -> result.add(StatusBreakdownItemDto.builder()
                        .code(e.getKey())
                        .label(resolveLabel(e.getKey()))
                        .badgeLabel(e.getKey())
                        .colorKey("purple")
                        .iconKey("pending")
                        .sortOrder(999)
                        .count(e.getValue())
                        .build()));

        return result;
    }

    @Transactional(readOnly = true)
    public List<StatusBreakdownItemDto> mergeBreakdowns(List<List<StatusBreakdownItemDto>> parts) {
        Map<String, Long> merged = new HashMap<>();
        for (List<StatusBreakdownItemDto> part : parts) {
            if (part == null) {
                continue;
            }
            for (StatusBreakdownItemDto item : part) {
                merged.merge(item.getCode(), item.getCount(), Long::sum);
            }
        }
        return buildBreakdown(merged);
    }

    public long sumBreakdownCounts(List<StatusBreakdownItemDto> breakdown) {
        if (breakdown == null) {
            return 0L;
        }
        return breakdown.stream().mapToLong(StatusBreakdownItemDto::getCount).sum();
    }

    private void validateRequest(AttendanceStatusTypeUpsertRequest request, String existingCode) {
        String code = normalizeCode(request.getCode());
        if (existingCode == null && (code == null || code.isBlank())) {
            throw new BusinessException("Mã trạng thái không hợp lệ");
        }
        if (!ALLOWED_COLOR_KEYS.contains(request.getColorKey())) {
            throw new BusinessException("Màu hiển thị không hợp lệ");
        }
        if (!ALLOWED_ICON_KEYS.contains(request.getIconKey())) {
            throw new BusinessException("Biểu tượng không hợp lệ");
        }
        if (request.getSortOrder() == null || request.getSortOrder() < 0) {
            throw new BusinessException("Thứ tự sắp xếp phải >= 0");
        }
    }

    private void applyRequest(AttendanceStatusType type, AttendanceStatusTypeUpsertRequest request, String code) {
        type.setCode(code);
        type.setLabel(request.getLabel().trim());
        type.setBadgeLabel(request.getBadgeLabel().trim());
        type.setColorKey(request.getColorKey());
        type.setIconKey(request.getIconKey());
        type.setSortOrder(request.getSortOrder());
        type.setActive(Boolean.TRUE.equals(request.getActive()));
    }

    private String normalizeCode(String code) {
        return code == null ? null : code.trim().toUpperCase(Locale.ROOT);
    }

    private StatusBreakdownItemDto toBreakdownItem(AttendanceStatusType type, long count) {
        return StatusBreakdownItemDto.builder()
                .code(type.getCode())
                .label(type.getLabel())
                .badgeLabel(type.getBadgeLabel())
                .colorKey(type.getColorKey())
                .iconKey(type.getIconKey())
                .sortOrder(type.getSortOrder())
                .count(count)
                .build();
    }

    private AttendanceStatusTypeDto toDto(AttendanceStatusType type) {
        return toDto(type, repository.countUsageByCode(type.getCode()));
    }

    private AttendanceStatusTypeDto toDto(AttendanceStatusType type, long usageCount) {
        return AttendanceStatusTypeDto.builder()
                .id(type.getId())
                .code(type.getCode())
                .label(type.getLabel())
                .badgeLabel(type.getBadgeLabel())
                .colorKey(type.getColorKey())
                .iconKey(type.getIconKey())
                .sortOrder(type.getSortOrder())
                .active(type.isActive())
                .usageCount(usageCount)
                .build();
    }
}
