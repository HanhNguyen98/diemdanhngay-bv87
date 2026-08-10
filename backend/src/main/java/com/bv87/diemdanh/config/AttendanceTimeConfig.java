package com.bv87.diemdanh.config;

import org.springframework.stereotype.Component;

import java.time.LocalTime;

/** Giờ mở / khóa Chấm công — đọc từ DB, fallback application.yml lúc khởi động. */
@Component
public class AttendanceTimeConfig {

    private volatile LocalTime openTime = LocalTime.of(6, 0);
    private volatile LocalTime lockTime = LocalTime.of(16, 0);
    private volatile LocalTime reminderTime = LocalTime.of(8, 0);

    public LocalTime getOpenTime() {
        return openTime;
    }

    public LocalTime getLockTime() {
        return lockTime;
    }

    public LocalTime getReminderTime() {
        return reminderTime;
    }

    public void setTimes(LocalTime open, LocalTime lock) {
        this.openTime = open;
        this.lockTime = lock;
    }

    public void setReminderTime(LocalTime reminderTime) {
        this.reminderTime = reminderTime;
    }
}
