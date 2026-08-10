-- P1.2c: Admin may re-view active kiosk token plaintext (ops Option A)
ALTER TABLE fingerprint_kiosk_tokens
    ADD COLUMN token_plaintext VARCHAR(128) NULL AFTER token_hash;
