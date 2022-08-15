/* eslint-disable unicorn/filename-case */

/**
 * @param { import("knex").Knex } knex
 */

export async function up(knex) {
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

/**
 * @param { import("knex").Knex } knex
 */

export async function down(_knex) {
  throw new Error("Rollback not supported");
}
