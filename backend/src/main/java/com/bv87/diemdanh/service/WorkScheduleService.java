package com.bv87.diemdanh.service;

import com.bv87.diemdanh.entity.SystemSettings;
import com.bv87.diemdanh.repository.SystemSettingsRepository;
import com.bv87.diemdanh.util.WorkSchedule;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Loads Admin work-schedule settings — SPEC_FINGERPRINT §4.13.1.
 */
@Service
@RequiredArgsConstructor
public class WorkScheduleService {

    private final SystemSettingsRepository settingsRepository;

    @Transactional(readOnly = true)
    public WorkSchedule current() {
        SystemSettings settings = settingsRepository.findById(1L).orElse(null);
        if (settings == null) {
            return WorkSchedule.defaults();
        }
        return WorkSchedule.parse(
                settings.getMorningInOfficial(),
                settings.getNoonOutOfficial(),
                settings.getAfternoonInOfficial(),
                settings.getAfternoonOutOfficial(),
                settings.getMorningOpen(),
                settings.getMidpoint1(),
                settings.getMidpointNoon(),
                settings.getMidpoint2(),
                settings.getDayClose(),
                settings.getLateGraceMinutes(),
                settings.getEarlyGraceMinutes());
    }
}
