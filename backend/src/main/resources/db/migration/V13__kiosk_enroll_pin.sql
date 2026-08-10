-- P2.1e: Admin manages enroll PIN on same kiosk token row (SPEC §10.1)
ALTER TABLE fingerprint_kiosk_tokens
    ADD COLUMN enroll_pin VARCHAR(16) NULL AFTER token_plaintext;
