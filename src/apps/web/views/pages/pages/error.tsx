import type { FC } from "@hono/hono/jsx";

export const PagesErrorPage: FC<{ errorMessage: string }> = (
  { errorMessage },
) => (
  <>
    <div class="container mt-5">
      <div class="row">
        <div class="col text-center">
          <h1>{errorMessage}</h1>

          <a href="/">Go Home</a>
        </div>
      </div>
    </div>
  </>
);
