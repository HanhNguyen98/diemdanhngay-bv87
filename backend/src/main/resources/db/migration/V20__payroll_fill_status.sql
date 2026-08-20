-- P8-NghiTrucWizard — Admin duyệt auto-fill giờ hành chính
ALTER TABLE attendance_records
    ADD COLUMN payroll_fill_status VARCHAR(20) NULL;
