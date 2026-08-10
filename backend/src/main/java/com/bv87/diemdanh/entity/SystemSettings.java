package com.bv87.diemdanh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
public class SystemSettings {

    @Id
    private Long id = 1L;

    @Column(name = "portal_title", nullable = false, length = 200)
    private String portalTitle = "BỆNH VIỆN QUÂN Y 87";

    @Column(name = "logo_url", columnDefinition = "MEDIUMTEXT")
    private String logoUrl;

    @Column(name = "login_avatar_url", columnDefinition = "MEDIUMTEXT")
    private String loginAvatarUrl;

    /** HH:mm — giờ tự động chốt sổ Chấm công; null = dùng application.yml */
    @Column(name = "attendance_lock_time", length = 5)
    private String attendanceLockTime;

    /** HH:mm — giờ tự động gửi nhắc nhở; null = dùng application.yml */
    @Column(name = "attendance_reminder_time", length = 5)
    private String attendanceReminderTime;
}
