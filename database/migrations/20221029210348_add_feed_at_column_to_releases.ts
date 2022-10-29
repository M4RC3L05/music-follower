/* eslint-disable unicorn/filename-case */

import type { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.schema.alterTable("releases", (table) => {
    table.timestamp("feedAt", { useTz: true });
  });

  await knex.raw(`update releases set "feedAt" = "releasedAt"`);

  await knex.schema.alterTable("releases", (table) => {
    table.timestamp("feedAt", { useTz: true }).notNullable().alter();
  });
}

export async function down(_knex: Knex) {
  throw new Error("Rollback not supported");
}
