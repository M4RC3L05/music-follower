/* eslint-disable unicorn/filename-case */

import type { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.schema.createTable("artists_users", (table) => {
    table.integer("userId").notNullable().references("id").inTable("users").onDelete("cascade").onUpdate("cascade");
    table
      .bigInteger("artistId")
      .notNullable()
      .references("id")
      .inTable("artists")
      .onDelete("cascade")
      .onUpdate("cascade");

    table.primary(["userId", "artistId"]);
  });
}

export async function down(_knex: Knex) {
  throw new Error("Rollback not supported");
}
