/* eslint-disable unicorn/filename-case */

import type { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.schema.alterTable("artists", (table) => {
    table.bigInteger("id").primary().notNullable().alter();
    table.text("name").notNullable().alter();
    table.text("imageUrl").notNullable().alter();
  });
}

export async function down(_knex: Knex) {
  throw new Error("Rollback not supported");
}
