CREATE TABLE IF NOT EXISTS "schema_migrations" (version varchar(128) PRIMARY KEY);

CREATE TABLE artists (
  id integer NOT NULL PRIMARY KEY,
  name text NOT NULL,
  image text DEFAULT "/public/images/remote-artist-image-default.svg"
) strict,
without rowid;

CREATE TABLE releases (
  id integer NOT NULL,
  "artistName" text NOT NULL,
  name text NOT NULL,
  "releasedAt" text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  "coverUrl" text NOT NULL,
  "type" text NOT NULL,
  metadata text NOT NULL DEFAULT ('{}'),
  "feedAt" text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  hidden text NOT NULL DEFAULT ('[]'),
  PRIMARY KEY (id, "type")
) strict,
without rowid;

-- Dbmate schema migrations
INSERT INTO
  "schema_migrations" (version)
VALUES
  ('20230829204155'),
  ('20230829204246'),
  ('20230829204255'),
  ('20231008135420'),
  ('20250705203401');
