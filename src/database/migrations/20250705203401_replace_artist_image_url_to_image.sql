-- migrate:up
ALTER TABLE
  artists DROP COLUMN "imageUrl";

ALTER TABLE
  artists
ADD
  COLUMN image text DEFAULT "/public/images/remote-artist-image-default.svg";

-- migrate:down
