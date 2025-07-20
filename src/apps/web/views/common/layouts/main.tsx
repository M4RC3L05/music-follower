import type { FC, PropsWithChildren } from "@hono/hono/jsx";
import type { SessionFlashMessages } from "#src/apps/web/types.ts";

export const MainLayout: FC<
  PropsWithChildren<
    {
      flashMessages?: SessionFlashMessages | undefined;
      enableNavbar?: boolean;
      path?: string;
      loggedIn: boolean;
    }
  >
> = (
  { path, children, flashMessages, enableNavbar = true, loggedIn },
) => (
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>MUSIC FOLLOWER | ADMIN</title>
      <link rel="stylesheet" href="/public/css/main.css" />
      <script
        type="module"
        dangerouslySetInnerHTML={{
          __html: `
            const getPreferredTheme = () => {
              return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
            };

            const setTheme = (theme) => {
              document.documentElement.setAttribute("data-bs-theme", theme);
            };

            setTheme(getPreferredTheme());

            globalThis.matchMedia("(prefers-color-scheme: dark)").addEventListener(
              "change",
              () => {
                setTheme(getPreferredTheme());
              },
            );
          `,
        }}
      />
    </head>

    <body>
      {enableNavbar
        ? (
          <nav class="navbar navbar-expand-lg bg-body-tertiary">
            <div class="container">
              <a class="navbar-brand" href={loggedIn ? "/" : "/auth/login"}>
                Music Follower
              </a>
              <button
                class="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span class="navbar-toggler-icon" />
              </button>
              <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                  {!loggedIn
                    ? (
                      <>
                        <li class="nav-item">
                          <a
                            class={`nav-link ${
                              path?.startsWith("/auth/login") ? "active" : ""
                            }`}
                            href="/auth/login"
                          >
                            Login
                          </a>
                        </li>
                        <li class="nav-item">
                          <a
                            class={`nav-link ${
                              path?.startsWith("/auth/register") ? "active" : ""
                            }`}
                            href="/auth/register"
                          >
                            Register
                          </a>
                        </li>
                      </>
                    )
                    : null}
                  {loggedIn
                    ? (
                      <>
                        <li class="nav-item">
                          <a
                            class={`nav-link ${
                              path === "/" || path === "" ? "active" : ""
                            }`}
                            aria-current="page"
                            href="/"
                          >
                            Home
                          </a>
                        </li>
                        <li class="nav-item">
                          <a
                            class={`nav-link ${
                              path?.startsWith("/artists") ? "active" : ""
                            }`}
                            href="/artists"
                          >
                            Artists
                          </a>
                        </li>
                        <li class="nav-item">
                          <a
                            class={`nav-link ${
                              path?.startsWith("/releases") ? "active" : ""
                            }`}
                            href="/releases"
                          >
                            Releases
                          </a>
                        </li>

                        <div
                          class="modal fade"
                          id="confirm-delete-account-modal"
                          tabindex={-1}
                        >
                          <div class="modal-dialog">
                            <div class="modal-content">
                              <div class="modal-header">
                                <h5 class="modal-title">
                                  Confirm delete account
                                </h5>
                                <button
                                  type="button"
                                  class="btn-close"
                                  data-bs-dismiss="modal"
                                  aria-label="Close"
                                >
                                </button>
                              </div>
                              <div class="modal-body">
                                <p>
                                  Are you sure you want to delet the current
                                  auth account?
                                </p>
                                <p>You will be able to create a new one.</p>
                              </div>
                              <div class="modal-footer">
                                <form method="post" action="/auth/delete">
                                  <input
                                    class="btn btn-outline-primary"
                                    type="submit"
                                    value="Confirm"
                                  />
                                </form>

                                <button
                                  type="button"
                                  class="btn btn-outline-secondary"
                                  data-bs-dismiss="modal"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <li
                          class="nav-item"
                          data-bs-toggle="modal"
                          data-bs-target="#confirm-delete-account-modal"
                        >
                          <a class="nav-link" style={{ cursor: "pointer" }}>
                            Delete account?
                          </a>
                        </li>
                        <li class="nav-item">
                          <form method="post" action="/auth/logout">
                            <input
                              type="submit"
                              value="Logout"
                              class="nav-link"
                            />
                          </form>
                        </li>
                      </>
                    )
                    : null}
                </ul>
              </div>
            </div>
          </nav>
        )
        : null}

      {flashMessages
        ? (
          <div
            id="flash-messages"
            class="position-fixed z-3 vstack gap-2 overflow-x-hidden overflow-y-scroll"
            style={{
              bottom: "1.3rem",
              right: "1.3rem",
              width: "600px",
              top: "1.3rem",
              pointerEvents: "none",
            }}
          >
            {flashMessages.error
              ? flashMessages.error.map((errMsg) => (
                <div
                  class="alert alert-danger alert-dismissible fade show mb-0 d-flex align-items-center"
                  role="alert"
                  style={{ pointerEvents: "all" }}
                >
                  <i class="bi bi-x-circle me-2"></i>
                  {errMsg}
                  <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="alert"
                    aria-label="Close"
                  >
                  </button>
                </div>
              ))
              : null}

            {flashMessages.warning
              ? flashMessages.warning.map((errMsg) => (
                <div
                  class="alert alert-warning alert-dismissible fade show mb-0 d-flex align-items-center"
                  role="alert"
                  style={{ pointerEvents: "all" }}
                >
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  {errMsg}
                  <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="alert"
                    aria-label="Close"
                  >
                  </button>
                </div>
              ))
              : null}

            {flashMessages.success
              ? flashMessages.success.map((errMsg) => (
                <div
                  class="alert alert-success alert-dismissible fade show mb-0 d-flex align-items-center"
                  role="alert"
                  style={{ pointerEvents: "all" }}
                >
                  <i class="bi bi-check-square me-2"></i>
                  {errMsg}
                  <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="alert"
                    aria-label="Close"
                  >
                  </button>
                </div>
              ))
              : null}

            {flashMessages.info
              ? flashMessages.info.map((errMsg) => (
                <div
                  class="alert alert-info alert-dismissible fade show mb-0 d-flex align-items-center"
                  role="alert"
                  style={{ pointerEvents: "all" }}
                >
                  <i class="bi bi-exclamation-square me-2"></i>
                  {errMsg}
                  <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="alert"
                    aria-label="Close"
                  >
                  </button>
                </div>
              ))
              : null}
          </div>
        )
        : null}

      {children}

      <script
        type="module"
        src="/deps/bootstrap/dist/js/bootstrap.bundle.js"
      />
    </body>
  </html>
);
