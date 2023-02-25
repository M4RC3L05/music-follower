#!/usr/bin/env -S node --no-warnings --loader=ts-node/esm

import process from "node:process";

import * as commands from "#src/commands/mod.js";
import logger from "#src/common/clients/logger.js";

const [commandName] = process.argv.slice(2);
const log = logger("run-command");

if (!(commandName in commands)) {
  throw new Error(`No command "${commandName}" found`);
}

try {
  log.info(`Running command "${commandName}"`);

  const command = commands[commandName as keyof typeof commands];
  await command.run();
} catch (error: unknown) {
  log.error(error, `Error running command "${commandName}"`);
} finally {
  log.info(`End command "${commandName}"`);
}
