ALTER TABLE audit_logs
    ADD COLUMN client_ip VARCHAR(64) NULL AFTER details_json,
    ADD COLUMN user_agent VARCHAR(255) NULL AFTER client_ip,
    ADD COLUMN attendance_date DATE NULL AFTER user_agent,
    ADD COLUMN emp_code INT NULL AFTER attendance_date;

ALTER TABLE audit_logs
    ADD KEY idx_audit_dept_date (dept_code, attendance_date),
    ADD KEY idx_audit_emp (emp_code);
