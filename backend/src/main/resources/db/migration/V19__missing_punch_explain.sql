-- P7-NghiTrucExplainGate — HEAD giải trình thiếu giờ (tách khỏi note)
ALTER TABLE attendance_records
    ADD COLUMN missing_punch_reason VARCHAR(255) NULL,
    ADD COLUMN payroll_intent VARCHAR(40) NULL;
