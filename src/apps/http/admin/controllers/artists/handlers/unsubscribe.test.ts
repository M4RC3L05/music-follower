import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { type RouterContext } from "@koa/router";

import * as database from "#src/database/mod.js";
import * as fixtures from "#src/utils/tests/fixtures/mod.js";
import * as hooks from "#src/utils/tests/hooks/mod.js";
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

    vi.spyOn(database.artists.table, "run").mockImplementation(() => {
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
    expect(database.artists.queries.getAll()).toHaveLength(1);
    expect(database.artists.queries.getById(2)?.id).toBe(2);
  });
});
