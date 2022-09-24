/* eslint-disable unicorn/filename-case */

import type { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.schema.createTable("releases", (table) => {
    table.bigInteger("id").primary();
    table.text("artistName");
    table.text("name");
    table.timestamp("releasedAt", { useTz: true });
    table.text("coverUrl");
  });
}

export async function down(_knex: Knex) {
  throw new Error("Rollback not supported");
}
