/* eslint-disable unicorn/filename-case */

import bcrypt from "bcrypt";
import type { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.schema.createTable("users", (table) => {
    table.increments("id", { primaryKey: true });
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

export async function down(_knex: Knex) {
  throw new Error("Rollback not supported");
}
