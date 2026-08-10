-- P2.2: mandatory finger note on active enrollment templates
ALTER TABLE employee_fingerprints
    ADD COLUMN finger_label VARCHAR(100) NULL;

UPDATE employee_fingerprints
SET finger_label = 'Chưa ghi chú'
WHERE active = 1
  AND (finger_label IS NULL OR TRIM(finger_label) = '');
