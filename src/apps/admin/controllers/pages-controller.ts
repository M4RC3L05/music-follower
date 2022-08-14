import { RouterContext } from "@koa/router";

export async function index(context: RouterContext) {
  await context.render("pages/index");
}
