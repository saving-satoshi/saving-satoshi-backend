BEGIN;

CREATE TABLE accounts_data (
  id serial PRIMARY KEY,
  lesson_id text NOT NULL UNIQUE,
  account_id int,
  data JSON NOT NULL DEFAULT '{}',
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

UPDATE migrations SET version = 5;
COMMIT;
