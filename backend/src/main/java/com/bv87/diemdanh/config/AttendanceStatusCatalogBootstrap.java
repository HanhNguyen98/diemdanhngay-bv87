package com.bv87.diemdanh.config;

import com.bv87.diemdanh.entity.AttendanceStatusType;
import com.bv87.diemdanh.repository.AttendanceStatusTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ensures KPI catalog has DI_TRE immediately after DI_LAM (SPEC P3b).
 * Local profile has flyway disabled — also drops legacy {@code metric_key} if present (V4).
 */
@Component
@Order(50)
@RequiredArgsConstructor
@Slf4j
public class AttendanceStatusCatalogBootstrap implements ApplicationRunner {

    private final AttendanceStatusTypeRepository repository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        dropLegacyMetricKeyIfPresent();
        upsert("DI_LAM", "Đi làm", "ĐI LÀM", "green", "check", 1);
        upsert("DI_TRE", "Đi trễ", "ĐI TRỄ", "amber", "late", 2);
        upsert("NGHI_PHEP", "Nghỉ phép", "NGHỈ PHÉP", "red", "x", 3);
        upsert("DI_HOC", "Đi học", "ĐI HỌC", "yellow", "graduation", 4);
        upsert("DI_CONG_TAC", "Đi công tác", "CÔNG TÁC", "blue", "briefcase", 5);
        upsert("THAI_SAN", "Thai sản", "THAI SẢN", "purple", "baby", 6);
        log.info("Attendance status catalog ensured (DI_TRE sort_order=2 after DI_LAM)");
    }

    private void dropLegacyMetricKeyIfPresent() {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'attendance_status_types'
                  AND COLUMN_NAME = 'metric_key'
                """,
                Integer.class);
        if (count != null && count > 0) {
            jdbcTemplate.execute("ALTER TABLE attendance_status_types DROP COLUMN metric_key");
            log.info("Dropped legacy attendance_status_types.metric_key (Flyway V4 equivalent)");
        }
    }

    private void upsert(
            String code,
            String label,
            String badgeLabel,
            String colorKey,
            String iconKey,
            int sortOrder) {
        AttendanceStatusType type = repository.findByCode(code).orElseGet(AttendanceStatusType::new);
        type.setCode(code);
        type.setLabel(label);
        type.setBadgeLabel(badgeLabel);
        type.setColorKey(colorKey);
        type.setIconKey(iconKey);
        type.setSortOrder(sortOrder);
        type.setActive(true);
        repository.save(type);
    }
}
