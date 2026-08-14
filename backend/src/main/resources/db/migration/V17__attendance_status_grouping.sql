ALTER TABLE attendance_status_types
    ADD COLUMN manual_allowed TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN group_parent TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN parent_code VARCHAR(50) NULL;

UPDATE attendance_status_types
SET manual_allowed = CASE
    WHEN code IN ('NGHI_PHEP', 'DI_HOC', 'DI_CONG_TAC', 'THAI_SAN') THEN 1
    ELSE 0
END,
    group_parent = 0,
    parent_code = NULL;

INSERT INTO attendance_status_types
    (code, label, badge_label, color_key, icon_key, sort_order, active, manual_allowed, group_parent, parent_code)
VALUES
    ('HSQ_BS', 'Hạ sĩ quan-Binh sĩ', 'HSQ, BS', 'teal', 'shield', 7, 1, 1, 1, NULL),
    ('HSQ_BS_WORK', 'HSQ-BS Đi làm', 'HSQ, BS LÀM', 'green', 'check', 8, 1, 1, 0, 'HSQ_BS'),
    ('HSQ_BS_LEAVE', 'HSQ-BS Nghỉ phép', 'HSQ, BS NGHỈ', 'red', 'x', 9, 1, 1, 0, 'HSQ_BS')
ON DUPLICATE KEY UPDATE
    label = VALUES(label),
    badge_label = VALUES(badge_label),
    color_key = VALUES(color_key),
    icon_key = VALUES(icon_key),
    sort_order = VALUES(sort_order),
    active = VALUES(active),
    manual_allowed = VALUES(manual_allowed),
    group_parent = VALUES(group_parent),
    parent_code = VALUES(parent_code);
