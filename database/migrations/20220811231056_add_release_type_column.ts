/* eslint-disable unicorn/filename-case */

import type { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.schema.alterTable("releases", (table) => {
    table.enum("type", ["collection", "track"]).nullable();
  });

  await knex.table("releases").update({ type: "collection" });

  await knex.schema.alterTable("releases", (table) => {
    table.enum("type", ["collection", "track"]).notNullable().alter();
  });
}

export async function down(_knex: Knex) {
  throw new Error("Rollback not supported");
}
