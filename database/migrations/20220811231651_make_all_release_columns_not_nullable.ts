/* eslint-disable unicorn/filename-case */

import type { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.schema.alterTable("releases", (table) => {
    table.bigInteger("id").primary().notNullable().alter();
    table.text("artistName").notNullable().alter();
    table.text("name").notNullable().alter();
    table
      .timestamp("releasedAt", { useTz: true })
      .notNullable()
      .defaultTo(knex.raw("(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))"))
      .alter();
    table.text("coverUrl").notNullable().alter();
  });
}

export async function down(_knex: Knex) {
  throw new Error("Rollback not supported");
}
