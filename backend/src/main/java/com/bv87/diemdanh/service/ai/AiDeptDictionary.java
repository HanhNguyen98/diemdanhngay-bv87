package com.bv87.diemdanh.service.ai;

import com.bv87.diemdanh.entity.Department;
import com.bv87.diemdanh.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AiDeptDictionary {

    private static final List<Map.Entry<String, String>> ABBREVIATIONS = List.of(
            Map.entry("khth", "kế hoạch - tổng hợp"),
            Map.entry("hckt", "hậu cần - kỹ thuật"),
            Map.entry("bgd", "ban giám đốc"),
            Map.entry("ct", "phòng chính trị"),
            Map.entry("tmhc", "tham mưu - hành chính"),
            Map.entry("dd", "phòng điều dưỡng"),
            Map.entry("btc", "ban tài chính")
    );

    private final DepartmentRepository departmentRepository;

    public Integer resolveDeptCode(String message) {
        if (message == null || message.isBlank()) {
            return null;
        }
        String normalized = normalize(message);

        for (Map.Entry<String, String> entry : ABBREVIATIONS) {
            if (containsAbbrev(normalized, entry.getKey())) {
                Optional<Integer> code = findDeptByNameFragment(entry.getValue());
                if (code.isPresent()) {
                    return code.get();
                }
            }
        }

        return departmentRepository.findAll().stream()
                .filter(Department::isActive)
                .filter(d -> matchesDeptName(normalized, d))
                .map(Department::getDeptCode)
                .findFirst()
                .orElse(null);
    }

    public boolean mentionsDepartment(String message) {
        if (message == null || message.isBlank()) {
            return false;
        }
        String normalized = normalize(message);
        if (containsAny(normalized, "toàn viện", "tất cả", "cả viện", "mọi phòng")) {
            return false;
        }
        for (Map.Entry<String, String> entry : ABBREVIATIONS) {
            if (containsAbbrev(normalized, entry.getKey())) {
                return true;
            }
        }
        return departmentRepository.findAll().stream()
                .filter(Department::isActive)
                .anyMatch(d -> matchesDeptName(normalized, d));
    }

    private Optional<Integer> findDeptByNameFragment(String fragment) {
        String needle = normalize(fragment);
        return departmentRepository.findAll().stream()
                .filter(Department::isActive)
                .filter(d -> normalize(d.getDeptName()).contains(needle))
                .map(Department::getDeptCode)
                .findFirst();
    }

    private boolean matchesDeptName(String normalized, Department dept) {
        String name = normalize(dept.getDeptName());
        return normalized.contains(name)
                || normalized.contains("khoa " + name)
                || normalized.contains("ban " + name)
                || normalized.contains("phòng " + name);
    }

    private String normalize(String text) {
        return text.toLowerCase(Locale.ROOT)
                .replace('đ', 'd')
                .replaceAll("\\s+", " ")
                .trim();
    }

    private boolean containsAbbrev(String text, String abbr) {
        String key = normalize(abbr);
        return text.contains(key);
    }

    private boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
