-- migrate:up

alter table "releases" add column hidden text not null default ('[]');

-- migrate:down

