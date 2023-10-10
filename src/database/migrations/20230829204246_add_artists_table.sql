-- migrate:up

create table "artists" (
  "id" integer not null primary key,
  "name" text not null,
  "imageUrl" text not null
) strict, without rowid;

-- migrate:down

