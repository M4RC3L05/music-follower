import { makeLogger } from "#src/common/logger/mod.ts";
import type { Artist } from "#src/database/types/mod.ts";
import type { CustomDatabase } from "#src/database/mod.ts";
import { delay } from "@std/async";
import { getArtistById } from "#src/remote/itunes/requests/mod.ts";
import { getArtistImage } from "#src/remote/apple-music/requests/mod.ts";

const log = makeLogger("sync-artists-image-job");

const runner = async ({
  db,
  abort,
}: { db: CustomDatabase; abort: AbortSignal }) => {
  if (abort.aborted) {
    return;
  }

  log.info("Begin artist image sync");

  const artists = db.prepare(`
    select *, row_number() over (order by id) as "index", ti."totalItems" as "totalItems"
    from
      artists,
      (select count(id) as "totalItems" from artists) as ti
    order by id;
  `).iter() as IterableIterator<Artist & { index: number; totalItems: number }>;

  for (const artist of artists) {
    const isLastArtist = artist.index >= artist.totalItems;

    if (abort.aborted) {
      break;
    }

    log.info(
      `Sync image from "${artist.name}" at ${artist.index} of ${artist.totalItems}`,
    );

    let imageUrl: string;

    try {
      const artistRemote = await getArtistById(artist.id, abort);

      if (!artistRemote) {
        throw new Error(`No remote artist found with id ${artist.id}`);
      }

      imageUrl = await getArtistImage(
        artistRemote.artistLinkUrl,
        abort,
      );
    } catch (error: unknown) {
      log.error("Something went wrong fetching artist image", { error });

      if (!isLastArtist) {
        log.info("Waiting 5 seconds before processing next artist");

        await delay(5000, { signal: abort }).catch(() => {});
      }

      continue;
    }

    if (abort.aborted) {
      break;
    }

    try {
      log.info("Updating artist image", { id: artist.id });

      db.sql`update artists set image = ${imageUrl} where id = ${artist.id}`;

      log.info("Artist image updated", { id: artist.id });
    } catch (error: unknown) {
      log.error("Something wrong ocurred while updating artist image", {
        error,
      });
    }

    if (!isLastArtist) {
      log.info("Waiting 5 seconds before processing next artist");

      await delay(5000, { signal: abort }).catch(() => {});
    }
  }

  log.info("Artist image sync ended");
};

export default runner;
