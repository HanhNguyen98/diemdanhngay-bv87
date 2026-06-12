package com.bv87.diemdanh.service;

import com.bv87.diemdanh.config.AttendanceTimeConfig;
import com.bv87.diemdanh.dto.BrandingDto;
import com.bv87.diemdanh.dto.BrandingUpdateRequest;
import com.bv87.diemdanh.entity.SystemSettings;
import com.bv87.diemdanh.exception.AccessDeniedException;
import com.bv87.diemdanh.exception.BusinessException;
import com.bv87.diemdanh.repository.SystemSettingsRepository;
import com.bv87.diemdanh.security.AuthUser;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private static final long MAX_LOGO_BYTES = 5L * 1024 * 1024;
    private static final Pattern LOGO_DATA_URL = Pattern.compile(
            "^data:(image/(?:jpeg|png|gif|webp));base64,([A-Za-z0-9+/=]+)$",
            Pattern.CASE_INSENSITIVE);
    private static final Set<String> ALLOWED_LOGO_MIME = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp");
    private static final String DEFAULT_PORTAL_TITLE = "BỆNH VIỆN QUÂN Y 87";
    private static final String LEGACY_PORTAL_TITLE = "Bệnh viện Quân y 87";
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private final SystemSettingsRepository settingsRepository;
    private final AttendanceTimeConfig attendanceTimeConfig;

    @Value("${app.attendance.open-time}")
    private String defaultOpenTime;

    @Value("${app.attendance.lock-time}")
    private String defaultLockTime;

    @Value("${app.attendance.reminder-time}")
    private String defaultReminderTime;

    @PostConstruct
    void initAttendanceTimes() {
        settingsRepository.findById(1L).ifPresent(settings -> {
            syncAttendanceTimes(settings);
            syncReminderTime(settings);
        });
    }

    @Transactional
    public BrandingDto getBranding() {
        return toDto(loadSettings());
    }

    @Transactional
    public BrandingDto updateBranding(AuthUser authUser, BrandingUpdateRequest request) {
        if (!authUser.isAdmin()) {
            throw new AccessDeniedException("Chỉ Admin mới được cấu hình hệ thống");
        }
        SystemSettings settings = loadSettings();
        settings.setPortalTitle(request.getPortalTitle().trim());
        if (request.getLogoUrl() != null) {
            applyImageUrl(settings::setLogoUrl, request.getLogoUrl(), "Logo");
        }
        if (request.getLoginAvatarUrl() != null) {
            applyImageUrl(settings::setLoginAvatarUrl, request.getLoginAvatarUrl(), "Ảnh đại diện đăng nhập");
        }
        if (request.getAttendanceLockTime() != null) {
            settings.setAttendanceLockTime(validateLockTime(request.getAttendanceLockTime()));
        }
        if (request.getAttendanceReminderTime() != null) {
            settings.setAttendanceReminderTime(validateReminderTime(request.getAttendanceReminderTime()));
        }
        SystemSettings saved = settingsRepository.save(settings);
        syncAttendanceTimes(saved);
        syncReminderTime(saved);
        return toDto(saved);
    }

    public String getResolvedReminderTime() {
        return resolveReminderTime(loadSettings());
    }

    private SystemSettings loadSettings() {
        SystemSettings settings = settingsRepository.findById(1L).orElseGet(() -> {
            SystemSettings created = new SystemSettings();
            created.setId(1L);
            created.setPortalTitle(DEFAULT_PORTAL_TITLE);
            return settingsRepository.save(created);
        });
        if (LEGACY_PORTAL_TITLE.equals(settings.getPortalTitle())) {
            settings.setPortalTitle(DEFAULT_PORTAL_TITLE);
            settings = settingsRepository.save(settings);
        }
        return settings;
    }

    private String normalizePortalTitle(String title) {
        if (title == null || title.isBlank() || LEGACY_PORTAL_TITLE.equals(title)) {
            return DEFAULT_PORTAL_TITLE;
        }
        return title;
    }

    private void applyImageUrl(java.util.function.Consumer<String> setter, String imageUrl, String label) {
        if (imageUrl.isBlank()) {
            setter.accept(null);
            return;
        }
        setter.accept(validateImageDataUrl(imageUrl, label));
    }

    private String validateImageDataUrl(String imageUrl, String label) {
        Matcher matcher = LOGO_DATA_URL.matcher(imageUrl.trim());
        if (!matcher.matches()) {
            throw new BusinessException(
                    label + " không hợp lệ. Chỉ chấp nhận JPG, PNG, GIF hoặc WEBP (tối đa 5MB).");
        }
        String mime = matcher.group(1).toLowerCase();
        if (!ALLOWED_LOGO_MIME.contains(mime)) {
            throw new BusinessException("Định dạng " + label.toLowerCase() + " không được hỗ trợ.");
        }
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(matcher.group(2));
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Không đọc được dữ liệu " + label.toLowerCase() + ". Vui lòng tải lên lại.");
        }
        if (bytes.length == 0 || bytes.length > MAX_LOGO_BYTES) {
            throw new BusinessException(label + " rỗng hoặc vượt quá 5MB.");
        }
        return imageUrl.trim();
    }

    private String validateLockTime(String raw) {
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            throw new BusinessException("Giờ chốt sổ không được để trống.");
        }
        LocalTime lockTime;
        try {
            lockTime = LocalTime.parse(trimmed, TIME_FMT);
        } catch (Exception ex) {
            throw new BusinessException("Giờ chốt sổ không hợp lệ. Dùng định dạng HH:mm (ví dụ 08:30).");
        }
        LocalTime openTime = LocalTime.parse(defaultOpenTime, TIME_FMT);
        if (!lockTime.isAfter(openTime)) {
            throw new BusinessException(
                    "Giờ chốt sổ phải sau giờ mở cửa điểm danh (" + defaultOpenTime + ").");
        }
        return lockTime.format(TIME_FMT);
    }

    private void syncAttendanceTimes(SystemSettings settings) {
        LocalTime open = LocalTime.parse(defaultOpenTime, TIME_FMT);
        String lockStr = settings.getAttendanceLockTime() != null && !settings.getAttendanceLockTime().isBlank()
                ? settings.getAttendanceLockTime()
                : defaultLockTime;
        LocalTime lock = LocalTime.parse(lockStr, TIME_FMT);
        attendanceTimeConfig.setTimes(open, lock);
    }

    private String validateReminderTime(String raw) {
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            throw new BusinessException("Giờ nhắc nhở không được để trống.");
        }
        try {
            return LocalTime.parse(trimmed, TIME_FMT).format(TIME_FMT);
        } catch (Exception ex) {
            throw new BusinessException("Giờ nhắc nhở không hợp lệ. Dùng định dạng HH:mm.");
        }
    }

    private void syncReminderTime(SystemSettings settings) {
        String reminderStr = resolveReminderTime(settings);
        attendanceTimeConfig.setReminderTime(LocalTime.parse(reminderStr, TIME_FMT));
    }

    private String resolveLockTime(SystemSettings settings) {
        if (settings.getAttendanceLockTime() != null && !settings.getAttendanceLockTime().isBlank()) {
            return settings.getAttendanceLockTime();
        }
        return defaultLockTime;
    }

    private String resolveReminderTime(SystemSettings settings) {
        if (settings.getAttendanceReminderTime() != null && !settings.getAttendanceReminderTime().isBlank()) {
            return settings.getAttendanceReminderTime();
        }
        return defaultReminderTime;
    }

    private BrandingDto toDto(SystemSettings settings) {
        return BrandingDto.builder()
                .portalTitle(normalizePortalTitle(settings.getPortalTitle()))
                .logoUrl(settings.getLogoUrl())
                .loginAvatarUrl(settings.getLoginAvatarUrl())
                .attendanceLockTime(resolveLockTime(settings))
                .attendanceOpenTime(defaultOpenTime)
                .attendanceReminderTime(resolveReminderTime(settings))
                .build();
    }
}
