/* eslint-disable unicorn/filename-case */

import type { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.schema.alterTable("releases", (table) => {
    table.json("metadata").notNullable().defaultTo(JSON.stringify({}));
  });
}

export async function down(_knex: Knex) {
  throw new Error("Rollback not supported");
}
