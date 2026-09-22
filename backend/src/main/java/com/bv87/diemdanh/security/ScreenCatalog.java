package com.bv87.diemdanh.security;

import com.bv87.diemdanh.entity.AccountRole;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Desktop screen catalog for ACL — SPEC_DUTY §7 / SPEC_ADMIN §8.1.
 */
public final class ScreenCatalog {

    public record ScreenDef(
            String code,
            String navId,
            String mode,
            String label,
            String group,
            boolean defaultForRole) {
    }

    private static final List<ScreenDef> ALL = List.of(
            // ADMIN
            def("admin.dashboard-overview", "dashboard-overview", "ADMIN", "Tổng quan chung", "Dashboard", true),
            def("admin.dashboard-dept", "dashboard-dept", "ADMIN", "Chi tiết đơn vị", "Dashboard", true),
            def("admin.departments", "departments", "ADMIN", "Đơn vị", "Danh mục", true),
            def("admin.staff", "staff", "ADMIN", "Nhân viên", "Danh mục", true),
            def("admin.ranks", "ranks", "ADMIN", "Cấp bậc", "Danh mục", true),
            def("admin.positions", "positions", "ADMIN", "Chức vụ", "Danh mục", true),
            def("admin.statuses", "statuses", "ADMIN", "Trạng thái chấm công", "Danh mục", true),
            def("admin.unlock-requests", "unlock-requests", "ADMIN", "Yêu cầu mở khóa", "Tiện ích", true),
            def("admin.audit-logs", "audit-logs", "ADMIN", "Nhật ký chỉnh sửa", "Tiện ích", true),
            def("admin.fingerprint-history", "fingerprint-history", "ADMIN", "Lịch sử vân tay", "Tiện ích", true),
            def("admin.fingerprint-enroll", "fingerprint-enroll", "ADMIN", "Đăng ký vân tay", "Tiện ích", true),
            def("admin.reminder-history", "reminder-history", "ADMIN", "Lịch sử nhắc nhở", "Tiện ích", true),
            def("admin.settings-permissions", "settings-permissions", "ADMIN", "Phân quyền", "Cài đặt", true),
            def("admin.settings-permission-groups", "settings-permission-groups", "ADMIN", "Nhóm quyền", "Cài đặt", true),
            def("admin.settings-kiosk", "settings-kiosk", "ADMIN", "Token Kiosk", "Cài đặt", true),
            def("admin.settings-system", "settings-system", "ADMIN", "Hệ thống", "Cài đặt", true),
            def("admin.password", "password", "ADMIN", "Đổi mật khẩu", "Cài đặt", true),
            // HEAD
            def("head.attendance", "attendance", "HEAD", "Chấm công", "Trưởng ĐV", true),
            def("head.statistics", "statistics", "HEAD", "Thống kê", "Trưởng ĐV", true),
            def("head.staff", "staff", "HEAD", "Nhân viên", "Trưởng ĐV", true),
            def("head.fingerprint-enroll", "fingerprint-enroll", "HEAD", "Đăng ký vân tay", "Trưởng ĐV", true),
            def("head.password", "password", "HEAD", "Đổi mật khẩu", "Trưởng ĐV", true),
            // DUTY defaults
            def("duty.dashboard-overview", "dashboard-overview", "DUTY", "Tổng quan chung", "Trực ban", true),
            def("duty.dashboard-dept", "dashboard-dept", "DUTY", "Chi tiết đơn vị", "Trực ban", true),
            def("duty.password", "password", "DUTY", "Đổi mật khẩu", "Trực ban", true)
    );

    /** Unique by code — ALL list may repeat whitelist entries already in ADMIN defaults. */
    private static final Map<String, ScreenDef> BY_CODE;

    static {
        Map<String, ScreenDef> map = new LinkedHashMap<>();
        for (ScreenDef def : ALL) {
            map.putIfAbsent(def.code(), def);
        }
        BY_CODE = Map.copyOf(map);
    }

    private static final Set<String> DUTY_WHITELIST = Set.of(
            "duty.dashboard-overview",
            "duty.dashboard-dept",
            "duty.password",
            "admin.unlock-requests",
            "admin.audit-logs",
            "admin.fingerprint-history",
            "admin.reminder-history"
    );

    private ScreenCatalog() {
    }

    private static ScreenDef def(
            String code, String navId, String mode, String label, String group, boolean defaultForRole) {
        return new ScreenDef(code, navId, mode, label, group, defaultForRole);
    }

    public static List<ScreenDef> allUnique() {
        return List.copyOf(BY_CODE.values());
    }

    public static ScreenDef require(String code) {
        ScreenDef def = BY_CODE.get(code);
        if (def == null) {
            throw new IllegalArgumentException("Unknown screen: " + code);
        }
        return def;
    }

    public static boolean exists(String code) {
        return BY_CODE.containsKey(code);
    }

    public static Set<String> defaultsFor(AccountRole role) {
        String mode = role.name();
        return BY_CODE.values().stream()
                .filter(d -> d.mode().equals(mode) && d.defaultForRole())
                .map(ScreenDef::code)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    public static Set<String> allowedFor(AccountRole role) {
        return switch (role) {
            case ADMIN -> BY_CODE.values().stream()
                    .filter(d -> "ADMIN".equals(d.mode()))
                    .map(ScreenDef::code)
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            case HEAD -> BY_CODE.values().stream()
                    .filter(d -> "HEAD".equals(d.mode()))
                    .map(ScreenDef::code)
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            case DUTY -> new LinkedHashSet<>(DUTY_WHITELIST);
        };
    }

    /**
     * Infers shell {@link AccountRole} from selected screen codes (SPEC_DUTY §7.1).
     * Duty whitelist admin.* codes count as DUTY, not ADMIN.
     *
     * @throws IllegalArgumentException if empty, unknown, or mixed shells
     */
    public static AccountRole inferRoleScope(Iterable<String> screenCodes) {
        Set<AccountRole> shells = new LinkedHashSet<>();
        boolean any = false;
        for (String raw : screenCodes) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            String code = raw.trim();
            if (!exists(code)) {
                throw new IllegalArgumentException("Unknown screen: " + code);
            }
            any = true;
            shells.add(shellForScreen(code));
        }
        if (!any) {
            throw new IllegalArgumentException("empty");
        }
        if (shells.size() != 1) {
            throw new IllegalArgumentException("mixed");
        }
        return shells.iterator().next();
    }

    /** Maps one screen code to the shell it belongs to. */
    public static AccountRole shellForScreen(String screenCode) {
        if (screenCode.startsWith("duty.") || DUTY_WHITELIST.contains(screenCode)) {
            return AccountRole.DUTY;
        }
        if (screenCode.startsWith("head.")) {
            return AccountRole.HEAD;
        }
        if (screenCode.startsWith("admin.")) {
            return AccountRole.ADMIN;
        }
        throw new IllegalArgumentException("Unknown screen shell: " + screenCode);
    }

    public static String codeFor(AccountRole role, String navId) {
        String prefix = role.name().toLowerCase(Locale.ROOT);
        String code = prefix + "." + navId;
        if (BY_CODE.containsKey(code)) {
            return code;
        }
        // DUTY may be granted admin.* utility screens
        if (role == AccountRole.DUTY) {
            String adminCode = "admin." + navId;
            if (DUTY_WHITELIST.contains(adminCode)) {
                return adminCode;
            }
        }
        return code;
    }

    public static List<ScreenDef> catalogWithDisplayLabels() {
        Map<String, Long> labelCounts = BY_CODE.values().stream()
                .collect(Collectors.groupingBy(ScreenDef::label, Collectors.counting()));
        List<ScreenDef> result = new ArrayList<>();
        for (ScreenDef def : BY_CODE.values()) {
            result.add(def);
        }
        return result;
    }

    public static String displayLabel(ScreenDef def, Map<String, Long> labelCounts) {
        long count = labelCounts.getOrDefault(def.label(), 1L);
        if (count <= 1) {
            return def.label();
        }
        return def.label() + " (" + modeSuffix(def.mode()) + ")";
    }

    public static Map<String, Long> labelCounts() {
        return BY_CODE.values().stream()
                .collect(Collectors.groupingBy(ScreenDef::label, Collectors.counting()));
    }

    public static String modeSuffix(String mode) {
        return switch (mode) {
            case "ADMIN" -> "Admin";
            case "HEAD" -> "Trưởng ĐV";
            case "DUTY" -> "Trực ban";
            default -> mode;
        };
    }
}
