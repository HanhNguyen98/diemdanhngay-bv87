package com.bv87.diemdanh.scheduler;

import com.bv87.diemdanh.service.AttendanceReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AttendanceReminderScheduler {

    private final AttendanceReminderService reminderService;

    @Scheduled(cron = "0 * * * * *", zone = "Asia/Ho_Chi_Minh")
    public void runAutoReminders() {
        try {
            reminderService.sendAutoRemindersIfDue();
        } catch (Exception ex) {
            log.warn("Auto reminder job failed: {}", ex.getMessage());
        }
    }
}
