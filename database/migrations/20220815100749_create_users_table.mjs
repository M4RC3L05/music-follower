/* eslint-disable unicorn/filename-case */

import bcrypt from "bcrypt";

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
      password: await bcrypt.hash("root", 12),
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
