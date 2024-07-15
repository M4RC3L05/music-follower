-- migrate:up transaction:false

pragma journal_mode = wall; -- noqa: PRS
pragma busy_timeout = 5000; -- noqa: PRS
pragma foreign_keys = on; -- noqa: PRS

-- migrate:down
