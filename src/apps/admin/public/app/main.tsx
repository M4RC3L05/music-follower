import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import router from "./pages/mod.js";

const appEl = globalThis.document.querySelector("#app");

if (appEl) {
  createRoot(appEl).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
} else {
  throw new Error("No element with id `app` exists.");
}
