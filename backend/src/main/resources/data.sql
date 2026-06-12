-- Dữ liệu mẫu Local Dev (INSERT IGNORE — an toàn khi khởi chạy lại)
SET NAMES utf8mb4;

-- 7 Đơn vị (mã INT 1-7, hiển thị 01-07 ở tầng ứng dụng)
INSERT IGNORE INTO departments (dept_code, dept_name) VALUES
    (1, 'Ban Giám đốc'),
    (2, 'Phòng Kế hoạch - Tổng hợp'),
    (3, 'Phòng Chính trị'),
    (4, 'Phòng Hậu cần - Kỹ thuật'),
    (5, 'Phòng Tham mưu - Hành chính'),
    (6, 'Phòng Điều dưỡng'),
    (7, 'Ban Tài chính');

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

-- Tài khoản đăng nhập (BCrypt: admin123 / head123)
-- is_active phải = 1; Hibernate tạo cột trước schema.sql nên default có thể là 0
INSERT IGNORE INTO accounts (username, password_hash, role, dept_code, emp_code, fullname, is_active) VALUES
    ('admin',         '$2b$10$BaHCNaTF4.dilc6sgHGlcuHV3ihn.NjO62AihUjutjkp9JEh8ui3y', 'ADMIN', NULL, NULL, 'Quản trị viên Hệ thống', 1),
    ('truongban01',   '$2b$10$iwj39QbCAG6T37mzW3YDjeWgASdBhenyZIERjolAPhmjvCewvy0kq', 'HEAD',  1, 1001, 'Nguyễn Văn An', 1),
    ('truongphong02', '$2b$10$iwj39QbCAG6T37mzW3YDjeWgASdBhenyZIERjolAPhmjvCewvy0kq', 'HEAD',  2, 2001, 'Trần Thị Bình', 1),
    ('truongphong03', '$2b$10$iwj39QbCAG6T37mzW3YDjeWgASdBhenyZIERjolAPhmjvCewvy0kq', 'HEAD',  3, 3001, 'Lê Văn Cường', 1),
    ('truongphong04', '$2b$10$iwj39QbCAG6T37mzW3YDjeWgASdBhenyZIERjolAPhmjvCewvy0kq', 'HEAD',  4, 4001, 'Phạm Thị Dung', 1),
    ('truongphong05', '$2b$10$iwj39QbCAG6T37mzW3YDjeWgASdBhenyZIERjolAPhmjvCewvy0kq', 'HEAD',  5, 5001, 'Hoàng Văn Em', 1),
    ('truongphong06', '$2b$10$iwj39QbCAG6T37mzW3YDjeWgASdBhenyZIERjolAPhmjvCewvy0kq', 'HEAD',  6, 6001, 'Vũ Thị Phương', 1),
    ('truongban07',   '$2b$10$iwj39QbCAG6T37mzW3YDjeWgASdBhenyZIERjolAPhmjvCewvy0kq', 'HEAD',  7, 7001, 'Đặng Văn Giang', 1);

UPDATE accounts SET is_active = 1 WHERE is_active = 0;

-- ADMIN không gắn nhân viên; sửa dữ liệu cũ nếu admin trùng emp_code với HEAD
UPDATE accounts SET emp_code = NULL, dept_code = NULL WHERE username = 'admin';

-- Loại bỏ trạng thái DI_TRE (đi trễ) — chỉ giữ 4 trạng thái chấm công
UPDATE attendance_records SET status = 'DI_LAM' WHERE status = 'DI_TRE';

-- Đồng bộ tên hệ thống in hoa
UPDATE system_settings SET portal_title = 'BỆNH VIỆN QUÂN Y 87'
WHERE portal_title = 'Bệnh viện Quân y 87' OR portal_title IS NULL OR portal_title = '';
