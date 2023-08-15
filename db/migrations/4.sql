BEGIN;

CREATE TABLE features (
  id serial PRIMARY KEY,
  feature_name text NOT NULL UNIQUE,
  feature_value smallint NOT NULL DEFAULT 0
);

UPDATE migrations SET version = 4;
COMMIT;
