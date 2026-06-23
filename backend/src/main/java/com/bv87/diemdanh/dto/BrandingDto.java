package com.bv87.diemdanh.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BrandingDto {
    private final String portalTitle;
    private final String logoUrl;
    private final String loginAvatarUrl;
    /** HH:mm — giờ chốt sổ điểm danh */
    private final String attendanceLockTime;
    /** HH:mm — giờ bắt đầu cho phép Điểm danh */
    private final String attendanceOpenTime;
    /** HH:mm — giờ tự động gửi nhắc nhở */
    private final String attendanceReminderTime;
}
