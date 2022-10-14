import { beforeAll, beforeEach } from "@jest/globals";
import { Model } from "objection";

import { knex } from "#src/core/clients/knex.js";

Model.knex(knex);

beforeAll(async () => {
  await knex.migrate.latest();
});

beforeEach(async () => {
  await knex.raw("DELETE FROM artists;");
  await knex.raw("DELETE FROM releases;");
  await knex.raw("VACUUM");
});
