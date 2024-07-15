-- migrate:up

create table releases (
  id integer not null,
  "artistName" text not null, -- noqa: RF06
  name text not null,
  "releasedAt" text default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')), -- noqa: RF06,LT05
  "coverUrl" text not null, -- noqa: RF06
  type text not null,
  metadata text not null default ('{}'),
  "feedAt" text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')), -- noqa: RF06,LT05

  primary key (id, type)
) strict, without rowid;

-- migrate:down
