-- migrate:up
ALTER TABLE
  releases
ADD
  COLUMN hidden text NOT NULL DEFAULT ('[]');

-- migrate:down
