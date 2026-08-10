-- P1: fingerprint templates enrolled via department kiosk Agent
CREATE TABLE IF NOT EXISTS employee_fingerprints (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    emp_code        INT          NOT NULL,
    finger_index    INT          NOT NULL DEFAULT 0,
    template_base64 MEDIUMTEXT   NOT NULL,
    template_len    INT          NOT NULL,
    zk_fid          INT          NULL,
    active          TINYINT(1)   NOT NULL DEFAULT 1,
    enrolled_at     DATETIME(6)  NOT NULL,
    enrolled_by     VARCHAR(100) NULL,
    source          VARCHAR(30)  NOT NULL DEFAULT 'KIOSK',
    PRIMARY KEY (id),
    KEY idx_fp_emp_active (emp_code, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fingerprint_kiosk_tokens (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    dept_code    INT          NOT NULL,
    token_hash   VARCHAR(64)  NOT NULL,
    label        VARCHAR(100) NULL,
    active       TINYINT(1)   NOT NULL DEFAULT 1,
    created_at   DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_kiosk_token_hash (token_hash),
    KEY idx_kiosk_dept (dept_code, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
