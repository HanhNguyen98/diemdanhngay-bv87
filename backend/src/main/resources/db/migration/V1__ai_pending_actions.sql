CREATE TABLE IF NOT EXISTS ai_pending_actions (
    action_id        VARCHAR(36)  NOT NULL,
    action_type      VARCHAR(50)  NOT NULL,
    dept_codes_json  TEXT         NOT NULL,
    expires_at       TIMESTAMP    NOT NULL,
    PRIMARY KEY (action_id),
    KEY idx_ai_pending_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
