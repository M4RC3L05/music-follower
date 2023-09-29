import { RouterProvider } from "react-router-dom";
import { StrictMode } from "react";
// eslint-disable-next-line n/file-extension-in-import
import { createRoot } from "react-dom/client";

import router from "./pages/mod.js";

createRoot(globalThis.document.querySelector("#app")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
