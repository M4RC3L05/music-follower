create table "tmp_artists" (
  "id" integer not null primary key,
  "name" text not null,
  "imageUrl" text not null
) strict, without rowid;

create table "tmp_releases" (
  "id" integer not null,
  "artistName" text not null,
  "name" text not null,
  "releasedAt" text default (strftime('%Y-%m-%dT%H:%M:%fZ' , 'now')),
  "coverUrl" text not null,
  "type" text not null,
  "metadata" text not null default ('{}'),
  "feedAt" text not null default (strftime('%Y-%m-%dT%H:%M:%fZ' , 'now')),

  primary key ("id", "type")
) strict, without rowid;

insert into "tmp_artists" 
select * from "artists";

insert into "tmp_releases" 
select * from "releases";

drop table "artists";
drop table "releases";

alter table "tmp_artists" rename to "artists";
alter table "tmp_releases" rename to "releases";