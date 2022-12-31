import type { RouterContext } from "@koa/router";

export const index = async (context: RouterContext) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  await context.render("pages/index", {
    _csrf: context.state._csrf,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    flashMessages: context.flash(),
  });
};
