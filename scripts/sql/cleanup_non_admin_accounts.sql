-- One-off local cleanup: keep only admin account (D-ACL reset)
-- Run: mysql -u root -p diemdanhngay_bv87_db < scripts/sql/cleanup_non_admin_accounts.sql

SET NAMES utf8mb4;

-- Dependent rows (non-CASCADE FKs)
DELETE FROM notifications
WHERE recipient_id IN (SELECT id FROM (SELECT id FROM accounts WHERE username <> 'admin') t)
   OR sender_id IN (SELECT id FROM (SELECT id FROM accounts WHERE username <> 'admin') t);

-- report / lock tables if present
DELETE FROM daily_report_submissions
WHERE submitted_by IN (SELECT id FROM (SELECT id FROM accounts WHERE username <> 'admin') t);

UPDATE daily_report_submissions SET head_account_id = NULL
WHERE head_account_id IN (SELECT id FROM (SELECT id FROM accounts WHERE username <> 'admin') t);

DELETE FROM attendance_manual_locks
WHERE locked_by IN (SELECT id FROM (SELECT id FROM accounts WHERE username <> 'admin') t);

DELETE FROM report_blocks
WHERE blocked_by IN (SELECT id FROM (SELECT id FROM accounts WHERE username <> 'admin') t);

-- CASCADE / nullable
DELETE FROM account_screens
WHERE account_id IN (SELECT id FROM (SELECT id FROM accounts WHERE username <> 'admin') t);

UPDATE accounts SET permission_group_id = NULL WHERE username <> 'admin';

UPDATE attendance_unlock_requests SET requested_by_account_id = NULL
WHERE requested_by_account_id IN (SELECT id FROM (SELECT id FROM accounts WHERE username <> 'admin') t);

DELETE FROM accounts WHERE username <> 'admin';

UPDATE accounts SET emp_code = NULL, dept_code = NULL, is_active = 1 WHERE username = 'admin';

SELECT id, username, role, is_active FROM accounts;
