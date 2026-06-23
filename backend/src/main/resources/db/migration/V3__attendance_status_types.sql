CREATE TABLE IF NOT EXISTS attendance_status_types (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    code         VARCHAR(50)  NOT NULL,
    label        VARCHAR(100) NOT NULL,
    badge_label  VARCHAR(100) NOT NULL,
    color_key    VARCHAR(20)  NOT NULL,
    icon_key     VARCHAR(30)  NOT NULL,
    metric_key   VARCHAR(50)  NOT NULL,
    sort_order   INT          NOT NULL DEFAULT 0,
    active       TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uk_att_status_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO attendance_status_types (code, label, badge_label, color_key, icon_key, metric_key, sort_order, active) VALUES
('DI_LAM', 'Đi làm', 'ĐI LÀM', 'green', 'check', 'DI_LAM', 1, 1),
('NGHI_PHEP', 'Nghỉ phép', 'NGHỈ PHÉP', 'red', 'x', 'NGHI_PHEP', 2, 1),
('DI_HOC', 'Đi học', 'ĐI HỌC', 'yellow', 'graduation', 'DI_HOC', 3, 1),
('DI_CONG_TAC', 'Đi công tác', 'CÔNG TÁC', 'blue', 'briefcase', 'DI_CONG_TAC', 4, 1);
