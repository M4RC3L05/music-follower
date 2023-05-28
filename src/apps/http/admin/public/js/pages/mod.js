import { Route, createHashRouter, createRoutesFromElements, redirect } from "react-router-dom";

import Layout from "../components/layout.js";
import html from "../common/html.js";

const router = createHashRouter(
  createRoutesFromElements(html`
    <${Route} path="/" element=${html`<${Layout} />`}>
      <${Route} index lazy=${() => import("./index-page.js")} />
      <${Route} path="artists" lazy=${() => import("./artists-page.js")}>
        <${Route} path="remote" lazy=${() => import("./artists-remote-page.js")} />
        <${Route}
          path="reset"
          loader=${() => {
            redirect("/artists", { replace: true });
            return null;
          }}
        />
      <//>
      <${Route}
        path="releases"
        lazy=${() => import("./releases-page.js")}
        shouldRevalidate=${({ currentUrl, nextUrl }) =>
          !currentUrl.searchParams.has("selectedRelease") && !nextUrl.searchParams.has("selectedRelease")}
      />
    <//>
  `),
);

export default router;
