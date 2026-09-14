CREATE TABLE fingerprint_template_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(40) NOT NULL,
    emp_code INT NOT NULL,
    dept_code INT NOT NULL,
    emp_fullname VARCHAR(200) NULL,
    actor_username VARCHAR(80) NULL,
    actor_role VARCHAR(20) NOT NULL,
    kiosk_label VARCHAR(100) NULL,
    finger_label VARCHAR(100) NULL,
    client_ip VARCHAR(64) NULL,
    note VARCHAR(255) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    KEY idx_fp_tpl_audit_created (created_at),
    KEY idx_fp_tpl_audit_dept (dept_code),
    KEY idx_fp_tpl_audit_emp (emp_code)
);
