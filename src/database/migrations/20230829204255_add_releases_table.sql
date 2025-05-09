-- migrate:up
CREATE TABLE releases (
  id integer NOT NULL,
  "artistName" text NOT NULL,
  name text NOT NULL,
  "releasedAt" text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  "coverUrl" text NOT NULL,
  "type" text NOT NULL,
  metadata text NOT NULL DEFAULT ('{}'),
  "feedAt" text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (id, "type")
) strict,
without rowid;

-- migrate:down
