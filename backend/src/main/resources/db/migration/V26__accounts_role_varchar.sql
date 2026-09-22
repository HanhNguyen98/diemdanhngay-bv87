-- SPEC_DUTY: accounts.role must accept DUTY. Legacy MySQL ENUM('ADMIN','HEAD')
-- truncates DUTY (SQL 1265) and returns HTTP 500 on create account.
ALTER TABLE accounts
    MODIFY COLUMN role VARCHAR(20) NOT NULL;
