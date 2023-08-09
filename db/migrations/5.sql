BEGIN;

CREATE TABLE data (
  id serial PRIMARY KEY,
  lesson_id text NOT NULL UNIQUE,
  value text NOT NULL
);

UPDATE migrations SET version = 5;
COMMIT;
