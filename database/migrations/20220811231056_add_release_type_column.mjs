/* eslint-disable unicorn/filename-case */

/**
 * @param { import("knex").Knex } knex
 */

export async function up(knex) {
  await knex.schema.alterTable("releases", (table) => {
    table.enum("type", ["collection", "track"]).nullable();
  });

  await knex.table("releases").update({ type: "collection" });

  await knex.schema.alterTable("releases", (table) => {
    table.enum("type", ["collection", "track"]).notNullable().alter();
  });
}

/**
 * @param { import("knex").Knex } knex
 */

export async function down(_knex) {
  throw new Error("Rollback not supported");
}
