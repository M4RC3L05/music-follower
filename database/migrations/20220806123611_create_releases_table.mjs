/* eslint-disable unicorn/filename-case */

/**
 * @param { import("knex").Knex } knex
 */

export async function up(knex) {
  await knex.schema.createTable("releases", (table) => {
    table.bigInteger("id").primary();
    table.text("artistName");
    table.text("name");
    table.timestamp("releasedAt", { useTz: true });
    table.text("coverUrl");
  });
}

/**
 * @param { import("knex").Knex } knex
 */

export async function down(_knex) {
  throw new Error("Rollback not supported");
}
