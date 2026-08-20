-- P15: Hibernate MySQL ENUM on notifications.type only had ATTENDANCE_REMINDER /
-- ADMIN_REMINDER_RESULT. INSERT UNLOCK_REQUEST failed (HTTP 500) and rolled back
-- the unlock request. Store type as VARCHAR so new NotificationType values work.
ALTER TABLE notifications
    MODIFY COLUMN type VARCHAR(40) NOT NULL;
