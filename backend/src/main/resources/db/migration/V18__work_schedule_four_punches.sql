-- P7 / SPEC_FINGERPRINT §4.13 — 4-phase work day, late_flag, kiosk machine, catalog VE_SOM + NGHI_TRUC

ALTER TABLE system_settings
    ADD COLUMN morning_in_official VARCHAR(5) NULL,
    ADD COLUMN noon_out_official VARCHAR(5) NULL,
    ADD COLUMN afternoon_in_official VARCHAR(5) NULL,
    ADD COLUMN afternoon_out_official VARCHAR(5) NULL,
    ADD COLUMN morning_open VARCHAR(5) NULL,
    ADD COLUMN midpoint1 VARCHAR(5) NULL,
    ADD COLUMN midpoint_noon VARCHAR(5) NULL,
    ADD COLUMN midpoint2 VARCHAR(5) NULL,
    ADD COLUMN day_close VARCHAR(5) NULL,
    ADD COLUMN late_grace_minutes INT NULL,
    ADD COLUMN early_grace_minutes INT NULL;

UPDATE system_settings SET
    morning_in_official = COALESCE(morning_in_official, '07:00'),
    noon_out_official = COALESCE(noon_out_official, '11:00'),
    afternoon_in_official = COALESCE(afternoon_in_official, '13:30'),
    afternoon_out_official = COALESCE(afternoon_out_official, '16:30'),
    morning_open = COALESCE(morning_open, '05:00'),
    midpoint1 = COALESCE(midpoint1, '09:00'),
    midpoint_noon = COALESCE(midpoint_noon, '12:16'),
    midpoint2 = COALESCE(midpoint2, '15:00'),
    day_close = COALESCE(day_close, '21:00'),
    late_grace_minutes = COALESCE(late_grace_minutes, 5),
    early_grace_minutes = COALESCE(early_grace_minutes, 5);

ALTER TABLE attendance_records
    ADD COLUMN morning_in_at DATETIME(6) NULL,
    ADD COLUMN noon_out_at DATETIME(6) NULL,
    ADD COLUMN afternoon_in_at DATETIME(6) NULL,
    ADD COLUMN afternoon_out_at DATETIME(6) NULL,
    ADD COLUMN late_flag TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN last_kiosk_hostname VARCHAR(120) NULL,
    ADD COLUMN last_kiosk_ip VARCHAR(64) NULL,
    ADD COLUMN last_kiosk_dept_code INT NULL,
    ADD COLUMN last_kiosk_label VARCHAR(120) NULL;

UPDATE attendance_records
SET morning_in_at = check_in_at,
    afternoon_out_at = check_out_at
WHERE morning_in_at IS NULL AND noon_out_at IS NULL
  AND afternoon_in_at IS NULL AND afternoon_out_at IS NULL;

ALTER TABLE fingerprint_scan_logs
    ADD COLUMN client_hostname VARCHAR(120) NULL,
    ADD COLUMN client_ip VARCHAR(64) NULL,
    ADD COLUMN kiosk_label VARCHAR(120) NULL;

UPDATE attendance_status_types
SET manual_allowed = 1
WHERE code IN ('NGHI_PHEP', 'DI_HOC', 'DI_CONG_TAC', 'THAI_SAN');

INSERT INTO attendance_status_types
    (code, label, badge_label, color_key, icon_key, sort_order, active, manual_allowed, group_parent, parent_code)
SELECT 'VE_SOM', 'Về sớm', 'VỀ SỚM', 'amber', 'clock', 11, 1, 1, 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM attendance_status_types WHERE code = 'VE_SOM');

INSERT INTO attendance_status_types
    (code, label, badge_label, color_key, icon_key, sort_order, active, manual_allowed, group_parent, parent_code)
SELECT 'NGHI_TRUC', 'Nghỉ trực', 'NGHỈ TRỰC', 'indigo', 'moon', 12, 1, 1, 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM attendance_status_types WHERE code = 'NGHI_TRUC');

INSERT INTO attendance_status_types
    (code, label, badge_label, color_key, icon_key, sort_order, active, manual_allowed, group_parent, parent_code)
SELECT 'NGHI_TRUC_FULL', 'Nghỉ trực 1 ngày', 'NGHỈ TRỰC · 1 NGÀY', 'indigo', 'moon', 13, 1, 1, 0, 'NGHI_TRUC'
WHERE NOT EXISTS (SELECT 1 FROM attendance_status_types WHERE code = 'NGHI_TRUC_FULL');

INSERT INTO attendance_status_types
    (code, label, badge_label, color_key, icon_key, sort_order, active, manual_allowed, group_parent, parent_code)
SELECT 'NGHI_TRUC_HALF', 'Nghỉ trực nửa ngày', 'NGHỈ TRỰC · NỬA NGÀY', 'cyan', 'moon', 14, 1, 1, 0, 'NGHI_TRUC'
WHERE NOT EXISTS (SELECT 1 FROM attendance_status_types WHERE code = 'NGHI_TRUC_HALF');
