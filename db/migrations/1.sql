BEGIN;
ALTER TABLE accounts
ADD COLUMN last_login timestamp;
UPDATE migrations
SET version = 1;
COMMIT;