import type { RouterContext } from "@koa/router";
import type { Next } from "koa";

export async function notAuthenticationMiddleware(context: RouterContext, next: Next) {
  if (context.session.user?.email !== null && context.session.user?.email !== undefined) {
    context.redirect("back");
    return;
  }

  await next();
}
