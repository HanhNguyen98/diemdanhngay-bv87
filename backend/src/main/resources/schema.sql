-- Khởi tạo bảng tự động khi ứng dụng chạy (MySQL 8, cổng 3306)
SET NAMES utf8mb4;
SET time_zone = '+07:00';

CREATE TABLE IF NOT EXISTS department_groups (
    group_code   INT          NOT NULL,
    group_name   VARCHAR(100) NOT NULL,
    sort_order   INT          NOT NULL DEFAULT 0,
    is_active    TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (group_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
    dept_code      INT          NOT NULL,
    dept_name      VARCHAR(100) NOT NULL,
    unit_code      VARCHAR(20)  NULL,
    group_code     INT          NOT NULL,
    location       VARCHAR(150) NULL,
    head_emp_code       INT          NULL,
    location_image_url  MEDIUMTEXT   NULL,
    is_active           TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (dept_code),
    KEY idx_dept_group (group_code),
    CONSTRAINT fk_dept_group FOREIGN KEY (group_code) REFERENCES department_groups (group_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS employees (
    emp_code      INT          NOT NULL,
    fullname      VARCHAR(100) NOT NULL,
    dept_code     INT          NOT NULL,
    rank_name     VARCHAR(100) NULL,
    position_name VARCHAR(150) NULL,
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    avatar_url    MEDIUMTEXT   NULL,
    PRIMARY KEY (emp_code),
    KEY idx_emp_dept (dept_code),
    CONSTRAINT fk_emp_dept FOREIGN KEY (dept_code) REFERENCES departments (dept_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_records (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    attendance_date DATE         NOT NULL,
    emp_code        INT          NOT NULL,
    status          VARCHAR(50)  NULL,
    note            VARCHAR(255) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_daily_attendance (attendance_date, emp_code),
    KEY idx_att_date (attendance_date),
    CONSTRAINT fk_att_emp FOREIGN KEY (emp_code) REFERENCES employees (emp_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_unlocks (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    attendance_date DATE         NOT NULL,
    dept_code       INT          NOT NULL,
    reason          VARCHAR(255) NOT NULL,
    unlocked_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_daily_unlock (attendance_date, dept_code),
    KEY idx_unlock_date (attendance_date),
    CONSTRAINT fk_unlock_dept FOREIGN KEY (dept_code) REFERENCES departments (dept_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng phụ: tài khoản đăng nhập (Admin / Trưởng ban) — cần cho phân quyền
CREATE TABLE IF NOT EXISTS accounts (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    dept_code     INT          NULL,
    emp_code      INT          NULL,
    fullname      VARCHAR(100) NOT NULL,
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username),
    KEY idx_acc_dept (dept_code),
    CONSTRAINT fk_acc_dept FOREIGN KEY (dept_code) REFERENCES departments (dept_code),
    CONSTRAINT fk_acc_emp FOREIGN KEY (emp_code) REFERENCES employees (emp_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_settings (
    id                        BIGINT       NOT NULL,
    portal_title              VARCHAR(200) NOT NULL DEFAULT 'BỆNH VIỆN QUÂN Y 87',
    logo_url                  MEDIUMTEXT   NULL,
    login_avatar_url          MEDIUMTEXT   NULL,
    attendance_lock_time      VARCHAR(5)   NULL,
    attendance_reminder_time  VARCHAR(5)   NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    recipient_id     BIGINT       NOT NULL,
    sender_id        BIGINT       NULL,
    type             VARCHAR(40)  NOT NULL,
    title            VARCHAR(120) NOT NULL,
    body             VARCHAR(500) NOT NULL,
    dept_code        INT          NULL,
    attendance_date  DATE         NOT NULL,
    is_read          TINYINT(1)   NOT NULL DEFAULT 0,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_notif_recipient (recipient_id, is_read, created_at),
    CONSTRAINT fk_notif_recipient FOREIGN KEY (recipient_id) REFERENCES accounts (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_reminder_logs (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    attendance_date  DATE         NOT NULL,
    dept_code        INT          NOT NULL,
    trigger_type     VARCHAR(10)  NOT NULL,
    head_account_id  BIGINT       NULL,
    admin_id         BIGINT       NULL,
    status           VARCHAR(20)  NOT NULL,
    message          VARCHAR(500) NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_reminder_log_date (attendance_date, trigger_type),
    CONSTRAINT fk_reminder_dept FOREIGN KEY (dept_code) REFERENCES departments (dept_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_report_submissions (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    attendance_date  DATE         NOT NULL,
    dept_code        INT          NOT NULL,
    submitted_by     BIGINT       NOT NULL,
    submitted_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_report_submission (attendance_date, dept_code),
    CONSTRAINT fk_report_sub_dept FOREIGN KEY (dept_code) REFERENCES departments (dept_code),
    CONSTRAINT fk_report_sub_account FOREIGN KEY (submitted_by) REFERENCES accounts (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_pending_actions (
    action_id        VARCHAR(36)  NOT NULL,
    action_type      VARCHAR(50)  NOT NULL,
    dept_codes_json  TEXT         NOT NULL,
    expires_at       TIMESTAMP    NOT NULL,
    PRIMARY KEY (action_id),
    KEY idx_ai_pending_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_manual_locks (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    attendance_date DATE         NOT NULL,
    dept_code       INT          NOT NULL,
    reason          VARCHAR(255) NOT NULL,
    locked_by       BIGINT       NOT NULL,
    locked_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_manual_lock (attendance_date, dept_code),
    KEY idx_manual_lock_date (attendance_date),
    CONSTRAINT fk_manual_lock_dept FOREIGN KEY (dept_code) REFERENCES departments (dept_code),
    CONSTRAINT fk_manual_lock_admin FOREIGN KEY (locked_by) REFERENCES accounts (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_report_blocks (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    attendance_date  DATE         NOT NULL,
    dept_code        INT          NOT NULL,
    reason           VARCHAR(255) NULL,
    blocked_by       BIGINT       NOT NULL,
    blocked_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_report_block (attendance_date, dept_code),
    CONSTRAINT fk_report_block_dept FOREIGN KEY (dept_code) REFERENCES departments (dept_code),
    CONSTRAINT fk_report_block_admin FOREIGN KEY (blocked_by) REFERENCES accounts (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employee_department_assignments (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    emp_code    INT          NOT NULL,
    dept_code   INT          NOT NULL,
    from_date   DATE         NOT NULL,
    to_date     DATE         NULL,
    reason      VARCHAR(255) NULL,
    created_by  VARCHAR(50)  NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_emp_assign_emp (emp_code, to_date),
    KEY idx_emp_assign_dept (dept_code),
    CONSTRAINT fk_emp_assign_emp FOREIGN KEY (emp_code) REFERENCES employees (emp_code),
    CONSTRAINT fk_emp_assign_dept FOREIGN KEY (dept_code) REFERENCES departments (dept_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
