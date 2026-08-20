CREATE TABLE attendance_unlock_requests (
    id                      BIGINT       NOT NULL AUTO_INCREMENT,
    attendance_date         DATE         NOT NULL,
    dept_code               INT          NOT NULL,
    reason                  VARCHAR(255) NOT NULL,
    status                  VARCHAR(20)  NOT NULL,
    requested_by            VARCHAR(50)  NOT NULL,
    requested_by_account_id BIGINT       NOT NULL,
    requested_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by             VARCHAR(50)  NULL,
    reviewed_at             DATETIME     NULL,
    review_note             VARCHAR(255) NULL,
    PRIMARY KEY (id),
    KEY idx_unlock_req_status (status, requested_at),
    KEY idx_unlock_req_dept_date (dept_code, attendance_date),
    CONSTRAINT fk_unlock_req_dept FOREIGN KEY (dept_code) REFERENCES departments (dept_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
