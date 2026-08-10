-- P2.1f / SPEC §4.4 A — OUT without IN may create day-record with status NULL (CHƯA CHẤM).
ALTER TABLE attendance_records
    MODIFY COLUMN status VARCHAR(50) NULL;
