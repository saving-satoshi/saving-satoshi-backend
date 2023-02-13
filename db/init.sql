CREATE TABLE migrations (
  id serial primary key,
  version integer not null
);
INSERT INTO migrations (version)
VALUES (0);
CREATE TABLE accounts (
  id serial PRIMARY KEY,
  private_key text NOT NULL UNIQUE,
  avatar text
);
CREATE TABLE accounts_progress (
  id serial PRIMARY KEY,
  account_id integer REFERENCES accounts (id),
  lesson_id integer NOT NULL,
  chapter_id integer NOT NULL
);
CREATE INDEX idx_accounts_private_key ON accounts (private_key);
CREATE INDEX idx_accounts_progress_account_id ON accounts_progress (account_id);
