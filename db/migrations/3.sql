BEGIN;
ALTER TABLE accounts_progress DROP COLUMN lesson_id;
ALTER TABLE accounts_progress DROP COLUMN chapter_id;
ALTER TABLE accounts_progress RENAME COLUMN account_id TO account;
ALTER TABLE accounts_progress ADD progress varchar(8) NOT NULL;
ALTER TABLE accounts_progress ADD CONSTRAINT unique_account UNIQUE (account);
UPDATE migrations SET version = 3;
COMMIT;
