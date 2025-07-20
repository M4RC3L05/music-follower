-- migrate:up
CREATE TABLE accounts (
  username text PRIMARY KEY NOT NULL,
  "password" text NOT NULL
) strict,
without rowid;

-- migrate:down
