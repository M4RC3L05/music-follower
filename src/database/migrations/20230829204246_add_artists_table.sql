-- migrate:up
CREATE TABLE artists (
  id integer NOT NULL PRIMARY KEY,
  name text NOT NULL,
  "imageUrl" text NOT NULL
) strict,
without rowid;

-- migrate:down
