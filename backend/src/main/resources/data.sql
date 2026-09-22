-- Dữ liệu mẫu Local Dev (INSERT IGNORE — an toàn khi khởi chạy lại)
SET NAMES utf8mb4;

-- Nhóm Đơn vị mặc định
INSERT IGNORE INTO department_groups (group_code, group_name, sort_order, is_active) VALUES
    (1, 'CƠ QUAN', 1, 1);

-- 7 Đơn vị (mã INT 1-7, hiển thị 01-07 ở tầng ứng dụng)
INSERT IGNORE INTO departments (dept_code, dept_name, group_code) VALUES
    (1, 'Ban Giám đốc', 1),
    (2, 'Phòng Kế hoạch - Tổng hợp', 1),
    (3, 'Phòng Chính trị', 1),
    (4, 'Phòng Hậu cần - Kỹ thuật', 1),
    (5, 'Phòng Tham mưu - Hành chính', 1),
    (6, 'Phòng Điều dưỡng', 1),
    (7, 'Ban Tài chính', 1);

-- Nhân viên mẫu: mã emp_code theo quy tắc dept*1000 + seq ( %05d)
INSERT IGNORE INTO employees (emp_code, fullname, dept_code, rank_name, position_name) VALUES
    (1001, 'Nguyễn Văn An',    1, 'Thượng tá',   'Trưởng ban'),
    (1002, 'Nguyễn Thị Hoa',   1, 'Trung tá',    'Nhân viên'),
    (1003, 'Trần Văn Hùng',    1, 'Thiếu tá',    'Nhân viên'),
    (1004, 'Lê Thị Lan',       1, 'Đại úy',      'Nhân viên'),
    (2001, 'Trần Thị Bình',    2, 'Thượng tá',   'Trưởng phòng'),
    (2002, 'Phạm Văn Minh',    2, 'Trung tá',    'Nhân viên'),
    (2003, 'Hoàng Thị Nga',    2, 'Thiếu tá',    'Nhân viên'),
    (2004, 'Vũ Văn Oanh',      2, 'Đại úy',      'Nhân viên'),
    (3001, 'Lê Văn Cường',     3, 'Thượng tá',   'Trưởng phòng'),
    (3002, 'Đặng Thị Phúc',    3, 'Trung tá',    'Nhân viên'),
    (3003, 'Bùi Văn Quân',     3, 'Thiếu tá',    'Nhân viên'),
    (4001, 'Phạm Thị Dung',    4, 'Thượng tá',   'Trưởng phòng'),
    (4002, 'Dương Thị Sương',  4, 'Trung tá',    'Nhân viên'),
    (4003, 'Ngô Văn Tài',      4, 'Thiếu tá',    'Nhân viên'),
    (4004, 'Mai Thị Uyên',     4, 'Đại úy',      'Nhân viên'),
    (5001, 'Hoàng Văn Em',     5, 'Thượng tá',   'Trưởng phòng'),
    (5002, 'Cao Văn Vinh',     5, 'Trung tá',    'Nhân viên'),
    (5003, 'Lý Thị Xuân',      5, 'Thiếu tá',    'Nhân viên'),
    (6001, 'Vũ Thị Phương',    6, 'Thượng tá',   'Trưởng phòng'),
    (6002, 'Đinh Văn Yên',     6, 'Trung tá',    'Nhân viên'),
    (6003, 'Hồ Thị Zin',       6, 'Thiếu tá',    'Nhân viên'),
    (6004, 'Tô Văn Anh',       6, 'Đại úy',      'Nhân viên'),
    (7001, 'Đặng Văn Giang',   7, 'Thượng tá',   'Trưởng ban'),
    (7002, 'Chu Thị Bích',     7, 'Trung tá',    'Nhân viên'),
    (7003, 'Võ Văn Cảnh',      7, 'Thiếu tá',    'Nhân viên');

-- Tài khoản đăng nhập — chỉ seed ADMIN (BCrypt: admin123)
-- HEAD/DUTY tạo qua UI Phân quyền; không seed HEAD mẫu
INSERT IGNORE INTO accounts (username, password_hash, role, dept_code, emp_code, fullname, is_active) VALUES
    ('admin', '$2b$10$BaHCNaTF4.dilc6sgHGlcuHV3ihn.NjO62AihUjutjkp9JEh8ui3y', 'ADMIN', NULL, NULL, 'Admin', 1);

UPDATE accounts SET is_active = 1 WHERE username = 'admin';

UPDATE departments SET is_active = 1 WHERE is_active = 0;

-- Gán nhóm CƠ QUAN cho Đơn vị cũ (DB đã tồn tại trước khi có nhóm)
INSERT IGNORE INTO department_groups (group_code, group_name, sort_order, is_active) VALUES
    (1, 'CƠ QUAN', 1, 1);
UPDATE departments SET group_code = 1 WHERE group_code IS NULL OR group_code = 0;

-- ADMIN không gắn nhân viên
UPDATE accounts SET emp_code = NULL, dept_code = NULL, fullname = 'Admin' WHERE username = 'admin';

-- Gỡ tài khoản HEAD mẫu cũ (đã bỏ seed; idempotent mỗi lần start local)
DELETE FROM notifications
WHERE recipient_id IN (
    SELECT id FROM (
        SELECT id FROM accounts
        WHERE username IN (
            'truongban01', 'truongphong02', 'truongphong03', 'truongphong04',
            'truongphong05', 'truongphong06', 'truongban07'
        )
    ) legacy_acc
)
   OR sender_id IN (
    SELECT id FROM (
        SELECT id FROM accounts
        WHERE username IN (
            'truongban01', 'truongphong02', 'truongphong03', 'truongphong04',
            'truongphong05', 'truongphong06', 'truongban07'
        )
    ) legacy_acc2
);
DELETE FROM account_screens
WHERE account_id IN (
    SELECT id FROM (
        SELECT id FROM accounts
        WHERE username IN (
            'truongban01', 'truongphong02', 'truongphong03', 'truongphong04',
            'truongphong05', 'truongphong06', 'truongban07'
        )
    ) legacy_acc
);
UPDATE accounts SET permission_group_id = NULL
WHERE username IN (
    'truongban01', 'truongphong02', 'truongphong03', 'truongphong04',
    'truongphong05', 'truongphong06', 'truongban07'
);
DELETE FROM accounts
WHERE username IN (
    'truongban01', 'truongphong02', 'truongphong03', 'truongphong04',
    'truongphong05', 'truongphong06', 'truongban07'
);

-- Không còn ép DI_TRE → DI_LAM (SPEC: giữ DI_TRE trong catalog + bản ghi ngày)
-- P3b catalog seed: AttendanceStatusCatalogBootstrap (Java) — tránh data.sql + cột legacy metric_key

-- Đồng bộ tên hệ thống in hoa
UPDATE system_settings SET portal_title = 'BỆNH VIỆN QUÂN Y 87'
WHERE portal_title = 'Bệnh viện Quân y 87' OR portal_title IS NULL OR portal_title = '';

UPDATE system_settings SET portal_subtitle = 'Chương trình chấm công'
WHERE portal_subtitle IS NULL OR portal_subtitle = '';

-- Backfill lịch sử đơn vị cho nhân viên hiện có (một bản ghi đang hiệu lực)
INSERT INTO employee_department_assignments (emp_code, dept_code, from_date, created_by, created_at)
SELECT e.emp_code, e.dept_code, '2020-01-01', 'system', NOW()
FROM employees e
WHERE NOT EXISTS (
    SELECT 1 FROM employee_department_assignments a
    WHERE a.emp_code = e.emp_code AND a.to_date IS NULL
);
