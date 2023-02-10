BEGIN;
ALTER TABLE accounts DROP COLUMN last_login;
UPDATE migrations
SET version = 2;
COMMIT;