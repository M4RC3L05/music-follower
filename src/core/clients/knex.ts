import config from "config";
import Knex from "knex";

export const knex = Knex.knex(config.get("database"));
