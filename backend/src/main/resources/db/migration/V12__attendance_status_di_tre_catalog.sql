-- P3b: Ensure DI_TRE (+ THAI_SAN) in catalog; KPI order: DI_LAM → DI_TRE → …
-- Unique key on `code` enables upsert.

INSERT INTO attendance_status_types (code, label, badge_label, color_key, icon_key, sort_order, active)
VALUES ('DI_TRE', 'Đi trễ', 'ĐI TRỄ', 'amber', 'late', 2, 1)
ON DUPLICATE KEY UPDATE
    label = VALUES(label),
    badge_label = VALUES(badge_label),
    color_key = VALUES(color_key),
    icon_key = VALUES(icon_key),
    sort_order = VALUES(sort_order),
    active = 1;

INSERT INTO attendance_status_types (code, label, badge_label, color_key, icon_key, sort_order, active)
VALUES ('THAI_SAN', 'Thai sản', 'THAI SẢN', 'purple', 'baby', 6, 1)
ON DUPLICATE KEY UPDATE
    label = VALUES(label),
    badge_label = VALUES(badge_label),
    color_key = VALUES(color_key),
    icon_key = VALUES(icon_key),
    sort_order = VALUES(sort_order),
    active = 1;

UPDATE attendance_status_types SET sort_order = 1, active = 1 WHERE code = 'DI_LAM';
UPDATE attendance_status_types SET sort_order = 2, active = 1 WHERE code = 'DI_TRE';
UPDATE attendance_status_types SET sort_order = 3, active = 1 WHERE code = 'NGHI_PHEP';
UPDATE attendance_status_types SET sort_order = 4, active = 1 WHERE code = 'DI_HOC';
UPDATE attendance_status_types SET sort_order = 5, active = 1 WHERE code = 'DI_CONG_TAC';
UPDATE attendance_status_types SET sort_order = 6, active = 1 WHERE code = 'THAI_SAN';
