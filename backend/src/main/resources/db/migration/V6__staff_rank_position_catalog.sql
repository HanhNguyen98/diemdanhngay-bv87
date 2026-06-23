CREATE TABLE IF NOT EXISTS staff_ranks (
    rank_code   INT          NOT NULL,
    rank_name   VARCHAR(100) NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (rank_code),
    UNIQUE KEY uk_staff_rank_name (rank_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_positions (
    position_code   INT          NOT NULL,
    position_name   VARCHAR(150) NOT NULL,
    sort_order      INT          NOT NULL DEFAULT 0,
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (position_code),
    UNIQUE KEY uk_staff_position_name (position_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE employees
    MODIFY COLUMN rank_name VARCHAR(100) NULL,
    MODIFY COLUMN position_name VARCHAR(150) NULL;

INSERT IGNORE INTO staff_ranks (rank_code, rank_name, sort_order, is_active) VALUES
(1, 'Đại tướng', 1, 1),
(2, 'Thượng tướng', 2, 1),
(3, 'Trung tướng', 3, 1),
(4, 'Thiếu tướng', 4, 1),
(5, 'Đại tá', 5, 1),
(6, 'Thượng tá', 6, 1),
(7, 'Trung tá', 7, 1),
(8, 'Thiếu tá', 8, 1),
(9, 'Đại úy', 9, 1),
(10, 'Thượng úy', 10, 1),
(11, 'Trung úy', 11, 1),
(12, 'Thiếu úy', 12, 1),
(13, 'Đại tá QNCN', 13, 1),
(14, 'Thượng tá QNCN', 14, 1),
(15, 'Trung tá QNCN', 15, 1),
(16, 'Thiếu tá QNCN', 16, 1),
(17, 'Đại úy QNCN', 17, 1),
(18, 'Thượng úy QNCN', 18, 1),
(19, 'Trung úy QNCN', 19, 1),
(20, 'Thiếu úy QNCN', 20, 1),
(21, 'Thượng sĩ', 21, 1),
(22, 'Trung sĩ', 22, 1),
(23, 'Hạ sĩ', 23, 1),
(24, 'Binh nhất', 24, 1),
(25, 'Binh nhì', 25, 1),
(26, 'Lao động hợp đồng', 26, 1);

INSERT IGNORE INTO staff_positions (position_code, position_name, sort_order, is_active) VALUES
(1, 'Bí thư Đảng ủy', 1, 1),
(2, 'Chủ nhiệm / Giám đốc bệnh viện', 2, 1),
(3, 'Chính ủy', 3, 1),
(4, 'Phó Chủ nhiệm / Phó Giám đốc', 4, 1),
(5, 'Phó Chính ủy', 5, 1),
(6, 'Chủ nhiệm Hội đồng Khoa học – Đào tạo', 6, 1),
(7, 'Chánh Văn phòng', 7, 1),
(8, 'Trưởng ban', 8, 1),
(9, 'Phó Trưởng ban', 9, 1),
(10, 'Trưởng khoa', 10, 1),
(11, 'Phó Trưởng khoa', 11, 1),
(12, 'Bác sĩ trưởng khoa', 12, 1),
(13, 'Trưởng phòng (Tổ chức nhân viên, CNTT, Tài chính, Vật tư…)', 13, 1),
(14, 'Phó Trưởng phòng', 14, 1),
(15, 'Trưởng nhóm / Tổ trưởng chuyên môn', 15, 1),
(16, 'Bác sĩ điều trị', 16, 1),
(17, 'Bác sĩ trực', 17, 1),
(18, 'Điều dưỡng trưởng khoa', 18, 1),
(19, 'Điều dưỡng viên', 19, 1),
(20, 'Kỹ thuật viên (CĐHA, xét nghiệm, dược…)', 20, 1),
(21, 'Hộ lý / Hộ sinh', 21, 1),
(22, 'Nhân viên LĐHĐ', 22, 1),
(23, 'Trưởng phòng', 23, 1);
