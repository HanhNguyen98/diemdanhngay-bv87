-- One HEAD account row per department (active or inactive).
-- Step 1: remove duplicate HEAD rows, keeping active first then lowest id.
DELETE a
FROM accounts a
INNER JOIN (
    SELECT dept_code,
           CAST(SUBSTRING_INDEX(GROUP_CONCAT(id ORDER BY is_active DESC, id ASC), ',', 1) AS UNSIGNED) AS keep_id
    FROM accounts
    WHERE role = 'HEAD' AND dept_code IS NOT NULL
    GROUP BY dept_code
    HAVING COUNT(*) > 1
) keeper ON a.dept_code = keeper.dept_code
WHERE a.role = 'HEAD'
  AND a.id <> keeper.keep_id;

-- Step 2: functional unique index (MySQL 8.0.13+)
CREATE UNIQUE INDEX uk_one_head_per_dept ON accounts ((
    CASE WHEN role = 'HEAD' AND dept_code IS NOT NULL THEN dept_code ELSE NULL END
));
