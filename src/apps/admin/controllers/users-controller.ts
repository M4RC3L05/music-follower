import type { RouterContext } from "@koa/router";
import bcrypt from "bcrypt";

import { makeLogger } from "#src/core/clients/logger.js";
import { userRepository } from "#src/entities/user/repositories/user-repository.js";

const logger = makeLogger("users-controller");

export async function index(context: RouterContext) {
  const page = context.request.query?.page ? Number(context.request.query?.page) : 0;
  const query = context.request.query?.q;
  const limit = 12;
  const authUser = await userRepository.getUserByEmail(context.session.user.email);
  const { results: users, total } = await userRepository.search({ limit, page, q: query as string });

  await context.render("users/index", {
    users,
    total,
    _csrf: context.state._csrf,
    flashMessages: context.flash(),
    authenticated: typeof context.session.user?.email === "string",
    userRole: authUser.role,
    query,
    page,
    limit,
  });
}

export async function create(context: RouterContext) {
  const authUser = await userRepository.getUserByEmail(context.session.user.email);

  await context.render("users/create", {
    _csrf: context.state._csrf,
    flashMessages: context.flash(),
    authenticated: typeof context.session.user?.email === "string",
    userRole: authUser.role,
  });
}

export async function store(context: RouterContext) {
  const { username, email, password, role } = context.request.body as {
    username: string;
    email: string;
    password: string;
    role: any;
  };

  try {
    if (!["admin", "user"].includes(role)) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Invalid role ${role}`);
    }

    await userRepository.createUser({ username, email, password: await bcrypt.hash(password, 12), role });

    context.flash("success", `Successfully created ${username}`);
  } catch (error: unknown) {
    logger.error(error, "Could not create user");
    context.flash("error", "Could not create user, check you inputs and try again.");
  } finally {
    context.redirect("/admin/users");
  }
}

export async function edit(context: RouterContext) {
  const { id } = context.request.query;

  if (!id) {
    context.flash("error", "No user id provided to edit");
    context.redirect("back");

    return;
  }

  const authUser = await userRepository.getUserByEmail(context.session.user.email);

  if (Number(id) === authUser.id) {
    context.flash("error", "Cannot edit yourself, use the profile page");
    context.redirect("back");

    return;
  }

  const user = await userRepository.getUser(Number(id as string));

  await context.render("users/edit", {
    _csrf: context.state._csrf,
    flashMessages: context.flash(),
    authenticated: typeof context.session.user?.email === "string",
    userRole: authUser.role,
    user,
  });
}

export async function destroy(context: RouterContext) {
  const { id } = context.request.body;

  const authUser = await userRepository.getUserByEmail(context.session.user.email);

  if (authUser.id === Number(id)) {
    context.flash("error", "Cannot delete yourself");
    context.redirect("back");

    return;
  }

  await userRepository.deleteUser(Number(id));

  context.flash("success", "Successfully delete user");
  context.redirect("back");
}

export async function update(context: RouterContext) {
  const { id, email, username } = context.request.body;
  const authUser = await userRepository.getUserByEmail(context.session.user.email);

  if (authUser.id === Number(id)) {
    context.flash("error", "Cannot edit yourself, use the profile page");
    context.redirect("back");

    return;
  }

  const user = await userRepository.getUser(Number(id));

  const toUpdate: any = {};

  if (user.username !== username) {
    toUpdate.username = username;
  }

  if (user.email !== email) {
    toUpdate.email = email;
  }

  try {
    await userRepository.updateUser(Number(id), toUpdate);

    context.flash("success", "Successfully edited user");
    context.redirect("/admin/users");
  } catch (error: unknown) {
    logger.error(error, "Could not edit user");
    context.flash("error", "Could not edit user, check your inputs and try again");
    context.redirect("back");
  }
}
