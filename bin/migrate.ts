#!/usr/bin/env -S node --no-warnings --loader=ts-node/esm

import { run } from "#src/commands/migrate.js";

await run();
