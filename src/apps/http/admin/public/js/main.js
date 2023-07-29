import { RouterProvider } from "react-router-dom";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import html from "./common/html.js";
import router from "./pages/mod.js";

createRoot(globalThis.document.querySelector("#app")).render(html`
  <${StrictMode}>
    <${RouterProvider} router=${router} />
  <//>
`);
