import type { FC } from "@hono/hono/jsx";

type AuthLoginPageProps = {
  formErrors?: Record<string, string[]> | undefined;
};

export const AuthLoginPage: FC<AuthLoginPageProps> = ({ formErrors }) => (
  <>
    <main>
      <div class="container mt-5">
        <div class="row">
          <div class="col-sm-8 offset-sm-2">
            <h1 class="text-center">Login</h1>

            <form action="/auth/login" method="post">
              <div class="mb-3">
                <label for="username" class="form-label">Username</label>
                <input
                  name="username"
                  id="username"
                  class={`form-control ${
                    formErrors?.username ? "is-invalid" : ""
                  }`}
                  required
                  aria-describedby={formErrors?.username
                    ? "username-validation-feedback"
                    : null}
                />
                {formErrors?.username
                  ? (
                    <div
                      id="username-validation-feedback"
                      class="invalid-feedback"
                    >
                      {formErrors.username.map((item, i) => (
                        <p key={i}>{item}</p>
                      ))}
                    </div>
                  )
                  : null}
              </div>

              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input
                  name="password"
                  id="password"
                  class={`form-control ${
                    formErrors?.password ? "is-invalid" : ""
                  }`}
                  required
                  type="password"
                  aria-describedby={formErrors?.password
                    ? "password-validation-feedback"
                    : null}
                />
                {formErrors?.password
                  ? (
                    <div
                      id="password-validation-feedback"
                      class="invalid-feedback"
                    >
                      {formErrors.password.map((item, i) => (
                        <p key={i}>{item}</p>
                      ))}
                    </div>
                  )
                  : null}
              </div>

              <div class="d-grid">
                <input
                  type="submit"
                  value="Login"
                  class="btn btn-outline-primary"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  </>
);
