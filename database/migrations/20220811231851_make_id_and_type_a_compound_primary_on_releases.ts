/* eslint-disable unicorn/filename-case */

import type { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.schema.alterTable("releases", (table) => {
    table.dropPrimary();
    table.primary(["id", "type"]);
  });
}

export async function down(_knex: Knex) {
  throw new Error("Rollback not supported");
}
