import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { type RouterContext } from "@koa/router";

import * as fixtures from "#src/common/utils/test-utils/fixtures/mod.js";
import * as hooks from "#src/common/utils/test-utils/hooks/mod.js";
import { artistQueries, artistsTable } from "#src/domain/artists/mod.js";
import { unsubscribe } from "./unsubscribe.js";

describe("unsusbcribe()", () => {
  beforeAll(async () => {
    await hooks.database.migrate();
  });

  afterEach(() => {
    hooks.database.cleanup();
  });

  it("should flash error if it could not unsubscribe from artist", async () => {
    const flash = vi.fn();
    const redirect = vi.fn();

    vi.spyOn(artistsTable, "run").mockImplementation(() => {
      throw new Error("foo");
    });

    await unsubscribe({ request: { body: { id: 1 } }, flash, redirect } as any as RouterContext);

    expect(flash).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledOnce();
    expect(flash).toHaveBeenCalledWith("error", "Could not unsubscribe from artist");
    expect(redirect).toHaveBeenCalledWith("back");
  });

  it("should flash success if it unsubscribe to artist", async () => {
    fixtures.artists.load({ id: 1 });
    fixtures.artists.load({ id: 2 });

    const flash = vi.fn();
    const redirect = vi.fn();

    await unsubscribe({ request: { body: { id: 1 } }, flash, redirect } as any as RouterContext);

    expect(flash).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledOnce();
    expect(flash).toHaveBeenCalledWith("success", "Successfully unsubscribed");
    expect(redirect).toHaveBeenCalledWith("back");
    expect(artistQueries.getAll()).toHaveLength(1);
    expect(artistQueries.getById(2)?.id).toBe(2);
  });
});
