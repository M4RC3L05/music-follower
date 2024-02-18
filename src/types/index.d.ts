import { type Database } from "@leafac/sqlite";
import type {
  ArtistsService,
  ReleasesService,
} from "../apps/admin/services/api/mod.js";

declare module "hono" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ContextVariableMap {
    database: Database;
    services: {
      api: {
        artistsService: ArtistsService;
        releasesService: ReleasesService;
      };
    };
  }
}
