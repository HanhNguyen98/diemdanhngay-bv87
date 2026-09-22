-- D-ACL.2: named permission groups (SPEC_DUTY §7.1)
CREATE TABLE IF NOT EXISTS permission_groups (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    role_scope   VARCHAR(20)  NOT NULL,
    is_active    TINYINT(1)   NOT NULL DEFAULT 1,
    created_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_permission_groups_name_role (name, role_scope)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permission_group_screens (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    group_id     BIGINT       NOT NULL,
    screen_code  VARCHAR(80)  NOT NULL,
    CONSTRAINT uk_pgs_group_code UNIQUE (group_id, screen_code),
    CONSTRAINT fk_pgs_group FOREIGN KEY (group_id) REFERENCES permission_groups (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE accounts
    ADD COLUMN permission_group_id BIGINT NULL AFTER emp_code,
    ADD CONSTRAINT fk_accounts_permission_group
        FOREIGN KEY (permission_group_id) REFERENCES permission_groups (id) ON DELETE SET NULL;

-- Seed templates
INSERT INTO permission_groups (name, role_scope, is_active) VALUES
    ('Trực ban cơ bản', 'DUTY', 1),
    ('Trực ban đầy đủ', 'DUTY', 1),
    ('Trưởng đơn vị chuẩn', 'HEAD', 1),
    ('Quản trị viên đầy đủ', 'ADMIN', 1);

SET @duty_basic := (SELECT id FROM permission_groups WHERE name = 'Trực ban cơ bản' AND role_scope = 'DUTY' LIMIT 1);
SET @duty_full := (SELECT id FROM permission_groups WHERE name = 'Trực ban đầy đủ' AND role_scope = 'DUTY' LIMIT 1);
SET @head_std := (SELECT id FROM permission_groups WHERE name = 'Trưởng đơn vị chuẩn' AND role_scope = 'HEAD' LIMIT 1);
SET @admin_full := (SELECT id FROM permission_groups WHERE name = 'Quản trị viên đầy đủ' AND role_scope = 'ADMIN' LIMIT 1);

INSERT INTO permission_group_screens (group_id, screen_code) VALUES
    (@duty_basic, 'duty.dashboard-overview'),
    (@duty_basic, 'duty.dashboard-dept'),
    (@duty_basic, 'duty.password'),
    (@duty_full, 'duty.dashboard-overview'),
    (@duty_full, 'duty.dashboard-dept'),
    (@duty_full, 'duty.password'),
    (@duty_full, 'admin.unlock-requests'),
    (@duty_full, 'admin.audit-logs'),
    (@duty_full, 'admin.fingerprint-history'),
    (@duty_full, 'admin.reminder-history'),
    (@head_std, 'head.attendance'),
    (@head_std, 'head.statistics'),
    (@head_std, 'head.staff'),
    (@head_std, 'head.fingerprint-enroll'),
    (@head_std, 'head.password'),
    (@admin_full, 'admin.dashboard-overview'),
    (@admin_full, 'admin.dashboard-dept'),
    (@admin_full, 'admin.departments'),
    (@admin_full, 'admin.staff'),
    (@admin_full, 'admin.ranks'),
    (@admin_full, 'admin.positions'),
    (@admin_full, 'admin.statuses'),
    (@admin_full, 'admin.unlock-requests'),
    (@admin_full, 'admin.audit-logs'),
    (@admin_full, 'admin.fingerprint-history'),
    (@admin_full, 'admin.fingerprint-enroll'),
    (@admin_full, 'admin.reminder-history'),
    (@admin_full, 'admin.settings-permissions'),
    (@admin_full, 'admin.settings-permission-groups'),
    (@admin_full, 'admin.settings-kiosk'),
    (@admin_full, 'admin.settings-system'),
    (@admin_full, 'admin.password');
