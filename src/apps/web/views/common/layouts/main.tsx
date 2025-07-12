import type { FC, PropsWithChildren } from "@hono/hono/jsx";
import type { SessionFlashMessages } from "#src/apps/web/types.ts";

export const MainLayout: FC<
  PropsWithChildren<
    {
      flashMessages?: SessionFlashMessages | undefined;
      enableNavbar?: boolean;
      path?: string;
    }
  >
> = (
  { path, children, flashMessages, enableNavbar = true },
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
              <a class="navbar-brand" href="/">
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
