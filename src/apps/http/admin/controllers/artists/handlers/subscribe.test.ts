import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { type RouterContext } from "@koa/router";

import * as hooks from "#src/utils/tests/hooks/mod.js";
import { subscribe } from "./subscribe.js";

describe("subscribe()", () => {
  beforeAll(async () => {
    await hooks.database.migrate();
  });

  afterEach(() => {
    hooks.database.cleanup();
  });

  it("should flash error if it fails to subscribe", async () => {
    const flash = vi.fn();
    const redirect = vi.fn();

    await subscribe({
      request: { body: { artistName: "foo", artistId: "foo", artistImage: "biz" } },
      flash,
      redirect,
    } as any as RouterContext);

    expect(flash).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledOnce();
    expect(flash).toHaveBeenCalledWith("error", 'Could not subscribe to artists "foo"');
    expect(redirect).toHaveBeenCalledWith("back");
  });

  it("should flash success if it subscribes to artist", async () => {
    const flash = vi.fn();
    const redirect = vi.fn();

    await subscribe({
      request: { body: { artistName: "foo", artistId: 123, artistImage: "biz" } },
      flash,
      redirect,
    } as any as RouterContext);

    expect(flash).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledOnce();
    expect(flash).toHaveBeenCalledWith("success", 'Successfully subscribed to "foo"');
    expect(redirect).toHaveBeenCalledWith("back");
  });
});
