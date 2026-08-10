-- P4: Agent heartbeat for Admin Online/Offline (SPEC_FINGERPRINT §9.5.2)
ALTER TABLE fingerprint_kiosk_tokens
    ADD COLUMN last_heartbeat_at DATETIME(6) NULL AFTER created_at;
