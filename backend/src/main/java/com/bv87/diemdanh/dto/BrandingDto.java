package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BrandingDto {
    private final String portalTitle;
    private final String logoUrl;
    private final String loginAvatarUrl;
    /** HH:mm — giờ chốt sổ Chấm công */
    private final String attendanceLockTime;
    /** HH:mm — giờ bắt đầu cho phép Chấm công */
    private final String attendanceOpenTime;
    /** HH:mm — giờ tự động gửi nhắc nhở */
    private final String attendanceReminderTime;
    private final String morningInOfficial;
    private final String noonOutOfficial;
    private final String afternoonInOfficial;
    private final String afternoonOutOfficial;
    private final String morningOpen;
    private final String midpoint1;
    private final String midpointNoon;
    private final String midpoint2;
    private final String dayClose;
    private final Integer lateGraceMinutes;
    private final Integer earlyGraceMinutes;
}
