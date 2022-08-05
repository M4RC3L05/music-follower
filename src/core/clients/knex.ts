import Knex from "knex";
import config from "config";

export const knex = Knex.knex(config.get("database"));
