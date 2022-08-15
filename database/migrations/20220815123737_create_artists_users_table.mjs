/* eslint-disable unicorn/filename-case */

/**
 * @param { import("knex").Knex } knex
 */

export async function up(knex) {
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

/**
 * @param { import("knex").Knex } knex
 */

export async function down(_knex) {
  throw new Error("Rollback not supported");
}
