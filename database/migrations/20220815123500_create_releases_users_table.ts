/* eslint-disable unicorn/filename-case */

import type { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.schema.createTable("releases_users", (table) => {
    table.integer("userId").notNullable().references("id").inTable("users").onDelete("cascade").onUpdate("cascade");
    table.bigInteger("releaseId").notNullable();
    table.text("releaseType").notNullable();
    table
      .foreign(["releaseId", "releaseType"])
      .references(["id", "type"])
      .inTable("releases")
      .onDelete("cascade")
      .onUpdate("cascade");
    table.primary(["userId", "releaseId", "releaseType"]);
  });
}

export async function down(_knex: Knex) {
  throw new Error("Rollback not supported");
}
