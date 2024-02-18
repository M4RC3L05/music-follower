import type {
  ArtistsService,
  ReleasesService,
} from "../apps/admin/services/api/mod.js";
import { type CustomDatabase } from "../database/mod.js";

declare module "hono" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ContextVariableMap {
    database: CustomDatabase;
    services: {
      api: {
        artistsService: ArtistsService;
        releasesService: ReleasesService;
      };
    };
  }
}
