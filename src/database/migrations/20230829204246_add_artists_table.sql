-- migrate:up

create table artists (
  id integer not null primary key,
  name text not null,
  "imageUrl" text not null -- noqa: RF06
) strict, without rowid;

-- migrate:down
