-- D-UAT.5 — portal subtitle under hospital name (sidebar / login)

ALTER TABLE system_settings
    ADD COLUMN portal_subtitle VARCHAR(200) NOT NULL DEFAULT 'Chương trình chấm công';
