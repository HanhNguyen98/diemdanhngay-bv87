-- P2.1: scan logs + day-record check-in/out for fingerprint Identify
CREATE TABLE IF NOT EXISTS fingerprint_scan_logs (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    emp_code     INT          NOT NULL,
    dept_code    INT          NOT NULL,
    scanned_at   DATETIME(6)  NOT NULL,
    direction    VARCHAR(20)  NOT NULL,
    score        INT          NULL,
    message      VARCHAR(255) NULL,
    created_at   DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    KEY idx_scan_emp_day (emp_code, scanned_at),
    KEY idx_scan_dept_day (dept_code, scanned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE attendance_records ADD COLUMN check_in_at DATETIME(6) NULL;
ALTER TABLE attendance_records ADD COLUMN check_out_at DATETIME(6) NULL;
ALTER TABLE attendance_records ADD COLUMN source VARCHAR(30) NULL;
