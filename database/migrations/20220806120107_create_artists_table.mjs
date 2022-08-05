/* eslint-disable unicorn/filename-case */

/**
 * @param { import("knex").Knex } knex
 */

export async function up(knex) {
  await knex.schema.createTable("artists", (table) => {
    table.bigInteger("id").primary();
    table.text("name");
    table.text("imageUrl");
  });
}

/**
 * @param { import("knex").Knex } knex
 */

export async function down(_knex) {
  throw new Error("Rollback not supported");
}
