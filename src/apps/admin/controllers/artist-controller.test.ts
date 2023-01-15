/* eslint-disable import/no-named-as-default-member */
import assert from "node:assert";
import { afterEach, before, describe, it } from "node:test";

import { type RouterContext } from "@koa/router";
import sinon from "sinon";

import * as database from "#src/database/index.js";
import { index, subscribe, unsubscribe } from "./artists-controller.js";
import { databaseHooks, nockHooks } from "#src/utils/tests/hooks/index.js";
import { appleMusicFixture, itunesFixtures, nockFixtures, artistFixtures } from "#src/utils/tests/fixtures/index.js";

describe("Artist Controller", () => {
  before(async () => {
    await databaseHooks.migrate();
  });

  describe("index()", () => {
    afterEach(() => {
      databaseHooks.cleanup();
      nockHooks.checkMocks();

      sinon.restore();
      sinon.reset();
    });

    it("should render index page", async () => {
      const render = sinon.spy(() => {
        /** */
      });
      await index({
        request: { query: { page: 1, q: "foo" } },
        render,
        flash: () => ({
          /** */
        }),
      } as any as RouterContext);

      assert.strict.equal(render.callCount, 1);
      assert.strict.deepEqual(render.getCalls()[0].args, [
        "artists/index",
        {
          artists: [],
          flashMessages: {},
          limit: 12,
          page: 1,
          query: "foo",
          remoteArtistQuery: undefined,
          remoteArtists: [],
          total: 0,
        },
      ]);
    });

    it("should search for artists if remote query is provided", async () => {
      nockFixtures.getAppleMusicArtistPage(
        200,
        "https://foo.com",
        appleMusicFixture.loadArtistPage("https://foo.com/foo.png"),
      );
      nockFixtures.searchArtists(
        200,
        {
          results: [itunesFixtures.loadItunesSearchArtist({ artistLinkUrl: "https://foo.com" })],
        },
        "bar",
      );

      const render = sinon.spy(() => {
        /** */
      });
      await index({
        request: { query: { remoteArtistQ: "bar" } },
        render,
        flash: () => ({
          /** */
        }),
      } as any as RouterContext);

      assert.strict.equal(render.callCount, 1);
      assert.strict.deepEqual(render.getCalls()[0].args, [
        "artists/index",
        {
          artists: [],
          flashMessages: {},
          limit: 12,
          page: 0,
          query: undefined,
          remoteArtistQuery: "bar",
          remoteArtists: [
            {
              amgArtistId: 144_725,
              artistId: 6_906_197,
              artistLinkUrl: "https://foo.com",
              artistName: "Foo Fighters",
              artistType: "Artist",
              image: "https://foo.com/256x256.png",
              isSubscribed: false,
              primaryGenreId: 21,
              primaryGenreName: "Rock",
              wrapperType: "artist",
            },
          ],
          total: 0,
        },
      ]);
    });

    it("should fallback to placeholder image on remote artist search", async () => {
      nockFixtures.getAppleMusicArtistPage(
        500,
        "https://foo.com",
        appleMusicFixture.loadArtistPage("https://foo.com/foo.png"),
      );
      nockFixtures.searchArtists(
        200,
        {
          results: [itunesFixtures.loadItunesSearchArtist({ artistLinkUrl: "https://foo.com" })],
        },
        "bar",
      );

      const render = sinon.spy(() => {
        /** */
      });
      await index({
        request: { query: { remoteArtistQ: "bar" } },
        render,
        flash: () => ({
          /** */
        }),
      } as any as RouterContext);

      assert.strict.equal(render.callCount, 1);
      assert.strict.deepEqual(render.getCalls()[0].args, [
        "artists/index",
        {
          artists: [],
          flashMessages: {},
          limit: 12,
          page: 0,
          query: undefined,
          remoteArtistQuery: "bar",
          remoteArtists: [
            {
              amgArtistId: 144_725,
              artistId: 6_906_197,
              artistLinkUrl: "https://foo.com",
              artistName: "Foo Fighters",
              artistType: "Artist",
              image: "https://via.placeholder.com/512",
              isSubscribed: false,
              primaryGenreId: 21,
              primaryGenreName: "Rock",
              wrapperType: "artist",
            },
          ],
          total: 0,
        },
      ]);
    });

    it("should indicate if the user is subscribed to the remote artist", async () => {
      nockFixtures.getAppleMusicArtistPage(
        200,
        "https://foo.com",
        appleMusicFixture.loadArtistPage("https://foo.com/foo.png"),
      );
      nockFixtures.searchArtists(
        200,
        {
          results: [itunesFixtures.loadItunesSearchArtist({ artistLinkUrl: "https://foo.com" })],
        },
        "bar",
      );
      artistFixtures.loadArtist({ id: 6_906_197 });

      const render = sinon.spy(() => {
        /** */
      });
      await index({
        request: { query: { remoteArtistQ: "bar" } },
        render,
        flash: () => ({
          /** */
        }),
      } as any as RouterContext);

      assert.strict.equal(render.callCount, 1);
      assert.strict.deepEqual(render.getCalls()[0].args, [
        "artists/index",
        {
          artists: [
            {
              id: 6_906_197,
              imageUrl: "http://foo.bix",
              name: "foo",
            },
          ],
          flashMessages: {},
          limit: 12,
          page: 0,
          query: undefined,
          remoteArtistQuery: "bar",
          remoteArtists: [
            {
              amgArtistId: 144_725,
              artistId: 6_906_197,
              artistLinkUrl: "https://foo.com",
              artistName: "Foo Fighters",
              artistType: "Artist",
              image: "https://foo.com/256x256.png",
              isSubscribed: true,
              primaryGenreId: 21,
              primaryGenreName: "Rock",
              wrapperType: "artist",
            },
          ],
          total: 1,
        },
      ]);
    });
  });

  describe("subscribe()", () => {
    afterEach(() => {
      databaseHooks.cleanup();

      sinon.restore();
      sinon.reset();
    });

    it("should flash error if it fails to subscribe", async () => {
      const flash = sinon.spy(() => {
        /** */
      });
      const redirect = sinon.spy(() => {
        /** */
      });

      await subscribe({
        request: { body: { artistName: "foo", artistId: "foo", artistImage: "biz" } },
        flash,
        redirect,
      } as any as RouterContext);

      assert.strict.equal(flash.callCount, 1);
      assert.strict.equal(redirect.callCount, 1);
      assert.strict.deepEqual(flash.getCalls()[0].args, ["error", 'Could not subscribe to artists "foo"']);
      assert.strict.deepEqual(redirect.getCalls()[0].args, ["back"]);
    });

    it("should flash success if it subscribes to artist", async () => {
      const flash = sinon.spy(() => {
        /** */
      });
      const redirect = sinon.spy(() => {
        /** */
      });

      await subscribe({
        request: { body: { artistName: "foo", artistId: 123, artistImage: "biz" } },
        flash,
        redirect,
      } as any as RouterContext);

      assert.strict.equal(flash.callCount, 1);
      assert.strict.equal(redirect.callCount, 1);
      assert.strict.deepEqual(flash.getCalls()[0].args, ["success", 'Successfully subscribed to "foo"']);
      assert.strict.deepEqual(redirect.getCalls()[0].args, ["back"]);
    });
  });

  describe("unsusbcribe()", () => {
    afterEach(() => {
      databaseHooks.cleanup();

      sinon.restore();
      sinon.reset();
    });

    it("should flash error if it could not unsubscribe from artist", async () => {
      const flash = sinon.spy(() => {
        /** */
      });
      const redirect = sinon.spy(() => {
        /** */
      });

      sinon.stub(database.artists.table, "run").throws();

      await unsubscribe({ request: { body: { id: 1 } }, flash, redirect } as any as RouterContext);

      assert.strict.equal(flash.callCount, 1);
      assert.strict.equal(redirect.callCount, 1);
      assert.strict.deepEqual(flash.getCalls()[0].args, ["error", "Could not unsubscribe from artist"]);
      assert.strict.deepEqual(redirect.getCalls()[0].args, ["back"]);
    });

    it("should flash success if it unsubscribe to artist", async () => {
      artistFixtures.loadArtist({ id: 1 });
      artistFixtures.loadArtist({ id: 2 });

      const flash = sinon.spy(() => {
        /** */
      });
      const redirect = sinon.spy(() => {
        /** */
      });

      await unsubscribe({ request: { body: { id: 1 } }, flash, redirect } as any as RouterContext);

      assert.strict.equal(flash.callCount, 1);
      assert.strict.equal(redirect.callCount, 1);
      assert.strict.deepEqual(flash.getCalls()[0].args, ["success", "Successfully unsubscribed"]);
      assert.strict.deepEqual(redirect.getCalls()[0].args, ["back"]);
      assert.strict.equal(database.artists.queries.getAll().length, 1);
      assert.strict.equal(database.artists.queries.getById(2)?.id, 2);
    });
  });
});
