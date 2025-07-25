import type { Hono } from "@hono/hono";
import { ArtistsRemotePage } from "#src/apps/web/views/artists/pages/remote.tsx";
import vine from "@vinejs/vine";
import {
  appleMusicRequests,
  type ItunesArtistSearchModel,
  itunesRequests,
} from "#src/remote/mod.ts";
import config from "#src/common/config/mod.ts";

const getRequestQuerySchema = vine.object({
  q: vine.string().trim().optional(),
});
const getRequestQueryValidator = vine.compile(getRequestQuerySchema);

const postRequestBodySchema = vine.object({
  id: vine.number(),
  name: vine.string(),
  image: vine.string(),
});
const postRequestBodyValidator = vine.compile(postRequestBodySchema);

export const remote = (router: Hono) => {
  router.get("/remote", async (c) => {
    const { q } = await getRequestQueryValidator.validate(c.req.query());

    const formErrors = c.get("session").get("flashFormErrors");

    if (!q) {
      return c.render(
        <ArtistsRemotePage
          q=""
          remoteArtists={[]}
          formErrors={formErrors ?? undefined}
        />,
      );
    }

    let remoteArtists: Array<
      ItunesArtistSearchModel & { image: string; isSubscribed: boolean }
    > = [];

    const artistsSearch = await itunesRequests.searchArtists(
      q,
      c.get("shutdown"),
    );

    const images = await Promise.allSettled(
      artistsSearch.results.map(({ artistLinkUrl }) =>
        appleMusicRequests.getArtistImage(artistLinkUrl, c.get("shutdown"))
      ),
    );

    remoteArtists = artistsSearch.results.map((artist, index) => ({
      ...artist,
      image: images.at(index) && images.at(index)!.status === "fulfilled"
        ? (images.at(index) as PromiseFulfilledResult<string>).value
        : config.media.remoteArtistsPlaceholderImage,
      isSubscribed: (c
        .get("database")
        .sql`select id from artists where id = ${artist.artistId}`[0]) !==
        undefined,
    }));

    return c.render(
      <ArtistsRemotePage
        q={q}
        remoteArtists={remoteArtists}
        formErrors={formErrors ?? undefined}
      />,
    );
  });

  router.post("/remote", async (c) => {
    const { name, id, image } = await postRequestBodyValidator.validate(
      await c.req.parseBody(),
    );

    const [inserted] = c.get("database").sql`
      insert into artists
        (id, name, image)
      values
        (${id}, ${name}, ${image})
      returning id;
    `;

    if (!inserted) {
      c.get("session").flash("flashMessages", {
        error: [`Could not subscribe to "${name}"`],
      });

      return c.redirect("/artists/remote");
    }

    c.get("session").flash("flashMessages", {
      success: [`Subscribed to "${name}" successfully`],
    });

    return c.redirect("/artists");
  });
};
