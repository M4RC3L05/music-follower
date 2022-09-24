/* eslint-disable unicorn/filename-case */

import type { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.schema.createTable("artists", (table) => {
    table.bigInteger("id").primary();
    table.text("name");
    table.text("imageUrl");
  });
}

export async function down(_knex: Knex) {
  throw new Error("Rollback not supported");
}
