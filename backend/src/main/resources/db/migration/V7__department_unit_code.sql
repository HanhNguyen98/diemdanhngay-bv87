ALTER TABLE departments
    ADD COLUMN unit_code VARCHAR(20) NULL COMMENT 'Optional display unit code (e.g. C11)' AFTER dept_name;
