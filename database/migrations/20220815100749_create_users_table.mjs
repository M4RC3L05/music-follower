/* eslint-disable unicorn/filename-case */

/**
 * @param { import("knex").Knex } knex
 */

export async function up(knex) {
  await knex.schema.createTable("users", (table) => {
    table.increments("id", true);
    table.text("username").notNullable();
    table.text("email").notNullable().unique();
    table.text("password").notNullable();
    table.enum("role", ["admin", "user"]).notNullable();
  });

  // Default admin user
  // Password: root
  await knex
    .insert({
      username: "admin",
      email: "admin@music-follower.com",
      password: "$2y$12$5qOVW7lz9kjlMitKZKaTa.Od171QzkTDiJQ9P7x.oWea8FcH.LFVO",
      role: "admin",
    })
    .into("users");
}

/**
 * @param { import("knex").Knex } knex
 */

export async function down(_knex) {
  throw new Error("Rollback not supported");
}
