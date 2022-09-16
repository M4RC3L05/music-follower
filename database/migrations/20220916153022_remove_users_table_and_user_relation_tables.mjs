/* eslint-disable unicorn/filename-case */

/**
 * @param { import("knex").Knex } knex
 */

export async function up(knex) {
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("artists_users");
  await knex.schema.dropTableIfExists("releases_users");
}

/**
 * @param { import("knex").Knex } knex
 */

export async function down(_knex) {
  throw new Error("Rollback not supported");
}
