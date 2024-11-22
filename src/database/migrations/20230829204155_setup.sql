-- migrate:up transaction:false
pragma journal_mode = wall;

pragma busy_timeout = 5000;

pragma foreign_keys = ON;

-- migrate:down
