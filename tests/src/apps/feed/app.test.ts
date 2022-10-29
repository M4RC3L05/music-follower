import { createServer } from "node:http";

import { describe, expect, jest, test } from "@jest/globals";
import config from "config";
import { makeFetch } from "supertest-fetch";

import { app } from "#src/apps/feed/app.js";
import { loadRelease } from "#tests/fixtures/releases.js";

const fetch = makeFetch(createServer(app().callback()));

describe("app", () => {
  test("it should throw 400 if it did not receive the format query", async () => {
    const data = await fetch("/");

    expect(data.status).toBe(400);
    expect(await data.text()).toBe("Invalid feed format provided");
  });

  test("it should throw 400 if the format provided is invalid", async () => {
    const data = await fetch("/?format=foo");

    expect(data.status).toBe(400);
    expect(await data.text()).toBe("Invalid feed format provided");
  });

  test('it should provide a feed in the format "rss"', async () => {
    await loadRelease({
      feedAt: new Date(2),
      id: 1,
      artistName: "foo",
      coverUrl: "http://foo.local/foo.png",
      name: "fiz",
      releasedAt: new Date(0),
      type: "collection",
    });
    await loadRelease({
      feedAt: new Date(0),
      id: 2,
      artistName: "foo",
      coverUrl: "http://foo.local/foo.png",
      name: "fiz",
      releasedAt: new Date(1000),
      type: "track",
    });
    await loadRelease({
      feedAt: new Date(1),
      id: 3,
      artistName: "foo",
      coverUrl: "http://foo.local/foo.png",
      name: "fiz",
      releasedAt: new Date(2000),
      type: "collection",
    });

    jest.spyOn(config, "get").mockReturnValueOnce(2);
    jest.useFakeTimers().setSystemTime(0);
    const data = await fetch("/?format=rss").expectStatus(200);

    expect(data.headers.get("content-type")).toBe("application/rss+xml");
    expect(await data.text()).toMatchSnapshot();
  });

  test('it should provide a feed in the format "atom"', async () => {
    await loadRelease({
      feedAt: new Date(2),
      id: 1,
      artistName: "foo",
      coverUrl: "http://foo.local/foo.png",
      name: "fiz",
      releasedAt: new Date(0),
      type: "collection",
    });
    await loadRelease({
      feedAt: new Date(0),
      id: 2,
      artistName: "foo",
      coverUrl: "http://foo.local/foo.png",
      name: "fiz",
      releasedAt: new Date(1000),
      type: "track",
    });
    await loadRelease({
      feedAt: new Date(1),
      id: 3,
      artistName: "foo",
      coverUrl: "http://foo.local/foo.png",
      name: "fiz",
      releasedAt: new Date(2000),
      type: "collection",
    });

    jest.spyOn(config, "get").mockReturnValueOnce(2);
    jest.useFakeTimers().setSystemTime(0);
    const data = await fetch("/?format=atom").expectStatus(200);

    expect(data.headers.get("content-type")).toBe("application/atom+xml");
    expect(await data.text()).toMatchSnapshot();
  });

  test('it should provide a feed in the format "json"', async () => {
    await loadRelease({
      feedAt: new Date(2),
      id: 1,
      artistName: "foo",
      coverUrl: "http://foo.local/foo.png",
      name: "fiz",
      releasedAt: new Date(0),
      type: "collection",
    });
    await loadRelease({
      feedAt: new Date(0),
      id: 2,
      artistName: "foo",
      coverUrl: "http://foo.local/foo.png",
      name: "fiz",
      releasedAt: new Date(1000),
      type: "track",
    });
    await loadRelease({
      feedAt: new Date(1),
      id: 3,
      artistName: "foo",
      coverUrl: "http://foo.local/foo.png",
      name: "fiz",
      releasedAt: new Date(2000),
      type: "collection",
    });

    jest.spyOn(config, "get").mockReturnValueOnce(2);
    jest.useFakeTimers().setSystemTime(0);
    const data = await fetch("/?format=json").expectStatus(200);

    expect(data.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(await data.text()).toMatchSnapshot();
  });
});
