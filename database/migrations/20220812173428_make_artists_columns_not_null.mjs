/* eslint-disable unicorn/filename-case */

/**
 * @param { import("knex").Knex } knex
 */

export async function up(knex) {
  await knex.schema.alterTable("artists", (table) => {
    table.bigInteger("id").primary().notNullable().alter();
    table.text("name").notNullable().alter();
    table.text("imageUrl").notNullable().alter();
  });
}

/**
 * @param { import("knex").Knex } knex
 */

export async function down(_knex) {
  throw new Error("Rollback not supported");
}
