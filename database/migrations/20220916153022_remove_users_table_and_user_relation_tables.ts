/* eslint-disable unicorn/filename-case */

import type { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("artists_users");
  await knex.schema.dropTableIfExists("releases_users");
}

export async function down(_knex: Knex) {
  throw new Error("Rollback not supported");
}
