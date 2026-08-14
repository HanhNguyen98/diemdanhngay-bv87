package com.bv87.diemdanh.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BrandingUpdateRequest {
    @NotBlank
    private String portalTitle;
    /** Data URL logo sidebar; null giữ nguyên, chuỗi rỗng để xóa */
    private String logoUrl;
    /** Data URL ảnh đại diện màn đăng nhập; null giữ nguyên, chuỗi rỗng để xóa */
    private String loginAvatarUrl;
    /** HH:mm — giờ chốt sổ Chấm công */
    private String attendanceLockTime;
    /** HH:mm — giờ tự động gửi nhắc nhở */
    private String attendanceReminderTime;
    private String morningInOfficial;
    private String noonOutOfficial;
    private String afternoonInOfficial;
    private String afternoonOutOfficial;
    private String morningOpen;
    private String midpoint1;
    private String midpointNoon;
    private String midpoint2;
    private String dayClose;
    private Integer lateGraceMinutes;
    private Integer earlyGraceMinutes;
}
