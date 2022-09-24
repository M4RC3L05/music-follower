import config from "config";
import type { Knex } from "knex";

export default { ...config.get<Knex.Config>("database") };
