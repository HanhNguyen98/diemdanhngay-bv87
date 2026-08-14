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
 * Local profile has flyway disabled — also applies V4 ({@code metric_key}) and V14
 * ({@code attendance_records.status} nullable) if still missing.
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
        ensureAttendanceStatusNullable();
        upsert("DI_LAM", "Đi làm", "ĐI LÀM", "green", "check", 1, false, false, null);
        upsert("DI_TRE", "Đi trễ", "ĐI TRỄ", "amber", "late", 2, false, false, null);
        upsert("NGHI_PHEP", "Nghỉ phép", "NGHỈ PHÉP", "red", "x", 3, true, false, null);
        upsert("DI_HOC", "Đi học", "ĐI HỌC", "yellow", "graduation", 4, true, false, null);
        upsert("DI_CONG_TAC", "Đi công tác", "CÔNG TÁC", "blue", "briefcase", 5, true, false, null);
        upsert("THAI_SAN", "Thai sản", "THAI SẢN", "purple", "baby", 6, true, false, null);
        upsert("HSQ_BS", "Hạ sĩ quan-Binh sĩ", "HSQ, BS", "teal", "shield", 7, true, true, null);
        upsert("HSQ_BS_WORK", "HSQ-BS Đi làm", "HSQ, BS LÀM", "green", "check", 8, true, false, "HSQ_BS");
        upsert("HSQ_BS_LEAVE", "HSQ-BS Nghỉ phép", "HSQ, BS NGHỈ", "red", "x", 9, true, false, "HSQ_BS");
        upsert("VE_SOM", "Về sớm", "VỀ SỚM", "amber", "clock", 11, true, false, null);
        upsert("NGHI_TRUC", "Nghỉ trực", "NGHỈ TRỰC", "indigo", "moon", 12, true, true, null);
        upsert("NGHI_TRUC_FULL", "Nghỉ trực 1 ngày", "NGHỈ TRỰC · 1 NGÀY", "indigo", "moon", 13, true, false, "NGHI_TRUC");
        upsert("NGHI_TRUC_HALF", "Nghỉ trực nửa ngày", "NGHỈ TRỰC · NỬA NGÀY", "cyan", "moon", 14, true, false, "NGHI_TRUC");
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

    /** P2.1f / §4.4 — afternoon/noon punch without morning IN stores status NULL. */
    private void ensureAttendanceStatusNullable() {
        Integer notNull = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'attendance_records'
                  AND COLUMN_NAME = 'status'
                  AND IS_NULLABLE = 'NO'
                """,
                Integer.class);
        if (notNull != null && notNull > 0) {
            jdbcTemplate.execute("ALTER TABLE attendance_records MODIFY COLUMN status VARCHAR(50) NULL");
            log.info("Made attendance_records.status nullable (Flyway V14 equivalent)");
        }
    }

    private void upsert(
            String code,
            String label,
            String badgeLabel,
            String colorKey,
            String iconKey,
            int sortOrder,
            boolean manualAllowed,
            boolean groupParent,
            String parentCode) {
        AttendanceStatusType type = repository.findByCode(code).orElseGet(AttendanceStatusType::new);
        type.setCode(code);
        type.setLabel(label);
        type.setBadgeLabel(badgeLabel);
        type.setColorKey(colorKey);
        type.setIconKey(iconKey);
        type.setSortOrder(sortOrder);
        type.setActive(true);
        type.setManualAllowed(manualAllowed);
        type.setGroupParent(groupParent);
        type.setParentCode(parentCode);
        repository.save(type);
    }
}
