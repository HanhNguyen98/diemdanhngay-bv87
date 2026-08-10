-- P2.1a: zk_fid must equal emp_code (unique per employee for SDK DBAdd / Identify)
UPDATE employee_fingerprints
SET zk_fid = emp_code
WHERE zk_fid IS NULL OR zk_fid <> emp_code;
