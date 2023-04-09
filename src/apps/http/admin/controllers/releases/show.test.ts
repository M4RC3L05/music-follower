import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { type RouterContext } from "@koa/router";

import * as fixtures from "#src/common/utils/test-utils/fixtures/mod.js";
import * as hooks from "#src/common/utils/test-utils/hooks/mod.js";
import { releasesQueries } from "#src/domain/releases/mod.js";
import { show } from "./show.js";

describe("show()", () => {
  beforeAll(async () => {
    await hooks.database.migrate();
  });

  afterEach(() => {
    hooks.database.cleanup();
  });

  it("should render the release page", async () => {
    fixtures.releases.load({ id: 1, type: "track" });
    const release = releasesQueries.getById(1, "track");
    const render = vi.fn();

    await show({
      params: { id: 1 },
      request: { query: { type: "track" } },
      render,
      flash: () => ({
        /** */
      }),
    } as any as RouterContext);

    expect(render).toHaveBeenCalledOnce();
    expect(render).toHaveBeenCalledWith("releases/show", { flashMessages: {}, release });
  });

  it("should redirect if ti did not found the release", async () => {
    const render = vi.fn();
    const flash = vi.fn();
    const redirect = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await show({ params: { id: 1 }, request: { query: { type: "track" } }, flash, render, redirect } as any);

    expect(render).not.toHaveBeenCalled();
    expect(flash).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledOnce();
    expect(flash).toHaveBeenCalledWith("error", 'No release exist with id "1" of type "track"');
    expect(redirect).toHaveBeenCalledWith("back");
  });
});
