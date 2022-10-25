import config from "config";
import type { Knex } from "knex";

// eslint-disable-next-line import/no-anonymous-default-export
export default { ...config.get<Knex.Config>("database") };
