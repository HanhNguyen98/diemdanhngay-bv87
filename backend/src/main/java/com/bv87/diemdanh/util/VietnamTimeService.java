package com.bv87.diemdanh.util;

import com.bv87.diemdanh.config.AttendanceTimeConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class VietnamTimeService {

    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private final AttendanceTimeConfig timeConfig;

    public VietnamTimeService(
            AttendanceTimeConfig timeConfig,
            @Value("${app.attendance.open-time}") String openTimeStr,
            @Value("${app.attendance.lock-time}") String lockTimeStr,
            @Value("${app.attendance.reminder-time}") String reminderTimeStr) {
        this.timeConfig = timeConfig;
        timeConfig.setTimes(LocalTime.parse(openTimeStr), LocalTime.parse(lockTimeStr));
        timeConfig.setReminderTime(LocalTime.parse(reminderTimeStr));
    }

    public ZonedDateTime now() {
        return ZonedDateTime.now(ZONE);
    }

    public LocalDate today() {
        return now().toLocalDate();
    }

    public LocalTime currentTime() {
        return now().toLocalTime();
    }

    public boolean isBeforeOpenWindow() {
        return currentTime().isBefore(timeConfig.getOpenTime());
    }

    public boolean isAfterLockTime() {
        return !currentTime().isBefore(timeConfig.getLockTime());
    }

    public boolean isWithinEditableWindow() {
        LocalTime t = currentTime();
        return !t.isBefore(timeConfig.getOpenTime()) && t.isBefore(timeConfig.getLockTime());
    }

    public LocalTime getOpenTime() {
        return timeConfig.getOpenTime();
    }

    public LocalTime getLockTime() {
        return timeConfig.getLockTime();
    }

    public String formatLockTime() {
        return timeConfig.getLockTime().format(TIME_FMT);
    }

    public String formatOpenTime() {
        return timeConfig.getOpenTime().format(TIME_FMT);
    }

    public LocalTime getReminderTimeFromConfig() {
        return timeConfig.getReminderTime();
    }

    public boolean isReminderMinute() {
        LocalTime now = currentTime();
        LocalTime reminder = timeConfig.getReminderTime();
        return now.getHour() == reminder.getHour() && now.getMinute() == reminder.getMinute();
    }
}
