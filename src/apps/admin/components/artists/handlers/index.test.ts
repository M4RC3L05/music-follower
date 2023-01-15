/* eslint-disable import/no-named-as-default-member */
import { afterEach, before, describe, it } from "node:test";
import assert from "node:assert";

import { type RouterContext } from "@koa/router";
import sinon from "sinon";

import * as fixtures from "#src/utils/tests/fixtures/mod.js";
import * as hooks from "#src/utils/tests/hooks/mod.js";
import { index } from "./index.js";

describe("index()", () => {
  before(async () => {
    await hooks.database.migrate();
  });

  afterEach(() => {
    hooks.database.cleanup();
    hooks.nock.checkMocks();

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
    fixtures.nock.getAppleMusicArtistPage(
      200,
      "https://foo.com",
      fixtures.appleMusic.loadArtistPage("https://foo.com/foo.png"),
    );
    fixtures.nock.searchArtists(
      200,
      {
        results: [fixtures.itunes.loadSearchArtist({ artistLinkUrl: "https://foo.com" })],
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
    fixtures.nock.getAppleMusicArtistPage(
      500,
      "https://foo.com",
      fixtures.appleMusic.loadArtistPage("https://foo.com/foo.png"),
    );
    fixtures.nock.searchArtists(
      200,
      {
        results: [fixtures.itunes.loadSearchArtist({ artistLinkUrl: "https://foo.com" })],
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
    fixtures.nock.getAppleMusicArtistPage(
      200,
      "https://foo.com",
      fixtures.appleMusic.loadArtistPage("https://foo.com/foo.png"),
    );
    fixtures.nock.searchArtists(
      200,
      {
        results: [fixtures.itunes.loadSearchArtist({ artistLinkUrl: "https://foo.com" })],
      },
      "bar",
    );
    const artist = fixtures.artists.load({ id: 6_906_197 });

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
        artists: [artist],
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
