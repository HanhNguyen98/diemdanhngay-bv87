-- D-ACL.1: per-account screen grants (SPEC_DUTY §7 / SPEC_ADMIN §8.1)
CREATE TABLE IF NOT EXISTS account_screens (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    account_id   BIGINT       NOT NULL,
    screen_code  VARCHAR(80)  NOT NULL,
    created_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_account_screens_account_code UNIQUE (account_id, screen_code),
    CONSTRAINT fk_account_screens_account
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
);

CREATE INDEX idx_account_screens_account ON account_screens (account_id);
