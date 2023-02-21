import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { type RouterContext } from "@koa/router";

import * as hooks from "#src/utils/tests/hooks/mod.js";
import { index } from "./index.js";

describe("index()", () => {
  beforeAll(async () => {
    await hooks.database.migrate();
  });

  afterEach(() => {
    hooks.database.cleanup();
  });

  it("should render index page", async () => {
    const render = vi.fn();

    await index({
      request: { query: {} },
      render,
      flash: () => ({
        /** */
      }),
    } as any as RouterContext);

    expect(render).toHaveBeenCalledOnce();
    expect(render).toHaveBeenCalledWith("releases/index", {
      flashMessages: {},
      limit: 12,
      page: 0,
      query: undefined,
      releases: [],
      total: 0,
    });
  });

  it("should render index page with params", async () => {
    const render = vi.fn();

    await index({
      request: { query: { page: 1, q: "foo" } },
      render,
      flash: () => ({
        /** */
      }),
    } as any as RouterContext);

    expect(render).toHaveBeenCalledOnce();
    expect(render).toHaveBeenCalledWith("releases/index", {
      flashMessages: {},
      limit: 12,
      page: 1,
      query: "foo",
      releases: [],
      total: 0,
    });
  });
});
