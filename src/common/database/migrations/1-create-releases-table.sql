create table "releases" (
  "id" bigint not null,
  "artistName" text not null,
  "name" text not null,
  "releasedAt" text default (strftime('%Y-%m-%dT%H:%M:%fZ' , 'now')),
  "coverUrl" text not null,
  "type" text not null,
  "metadata" text not null default ('{}'),
  "feedAt" text not null default (strftime('%Y-%m-%dT%H:%M:%fZ' , 'now')),

  primary key ("id", "type")
);
