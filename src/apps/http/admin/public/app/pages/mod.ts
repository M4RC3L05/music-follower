import { Route, createHashRouter, createRoutesFromElements, redirect } from "react-router-dom";

import Layout from "../components/layout.js";
import html from "../common/html.js";

const router = createHashRouter(
  createRoutesFromElements(html`
    <${Route} path="/" element=${html`<${Layout} />`}>
      <${Route} index lazy=${async () => import("./index-page.js")} />
      <${Route} path="artists" lazy=${async () => import("./artists-page.js")}>
        <${Route} path="remote" lazy=${async () => import("./artists-remote-page.js")} />
        <${Route}
          path="reset"
          loader=${() => {
            redirect("/artists", { replace: true } as any as RequestInit);
            return null;
          }}
        />
      <//>
      <${Route}
        path="releases"
        lazy=${async () => import("./releases-page.js")}
        shouldRevalidate=${({ currentUrl, nextUrl }: { currentUrl: URL; nextUrl: URL }) =>
          !currentUrl.searchParams.has("selectedRelease") && !nextUrl.searchParams.has("selectedRelease")}
      />
    <//>
  `),
);

export default router;
