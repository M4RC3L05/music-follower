import type { FC } from "@hono/hono/jsx";
import { SessionFlashFormErrors } from "#src/apps/web/types.ts";

export const ArtistsImportPage: FC<
  { formErrors?: SessionFlashFormErrors | undefined }
> = ({ formErrors }) => (
  <>
    <main class="mt-5">
      <div class="container">
        <div className="row">
          <div class="col text-center">
            <h1>Import artists</h1>
          </div>
        </div>
        <div class="row">
          <div class="col-md-8 offset-md-2">
            <form
              action="/artists/import"
              method="post"
              enctype="multipart/form-data"
            >
              <div class="mb-3">
                <label for="file" class="form-label">Artists file</label>
                <input
                  class={`form-control ${formErrors?.file ? "is-invalid" : ""}`}
                  type="file"
                  id="file"
                  name="file"
                  placeholder="Artists file"
                  required
                />
                {formErrors?.file
                  ? (
                    <div class="invalid-feedback">
                      {formErrors.file.map((item) => <p>{item}</p>)}
                    </div>
                  )
                  : null}
              </div>

              <div className="d-grid">
                <button type="submit" class="btn btn-outline-primary">
                  Import
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  </>
);
