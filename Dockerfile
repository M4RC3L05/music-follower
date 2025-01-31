FROM docker.io/denoland/deno:alpine-2.1.9 as build

RUN mkdir /app
RUN chown -R deno:deno /app

USER deno

WORKDIR /app

COPY --chown=deno:deno . .

RUN deno install

RUN deno task admin:bundle:css

FROM docker.io/denoland/deno:alpine-2.1.9

RUN mkdir /app
RUN chown -R deno:deno /app

USER deno

WORKDIR /app

COPY --chown=deno:deno . .
COPY --from=build /app/src/apps/admin/public /app/src/apps/admin/public

RUN deno install --unstable-npm-lazy-caching --entrypoint src/apps/api/main.ts src/apps/admin/main.ts src/apps/feed/main.ts src/apps/jobs/sync-releases/main.ts
RUN deno eval "import '@db/sqlite'"

RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 2s deno run -A --cached-only --unstable-npm-lazy-caching src/apps/api/main.ts || true
RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 2s deno run -A --cached-only --unstable-npm-lazy-caching src/apps/admin/main.ts || true
RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 2s deno run -A --cached-only --unstable-npm-lazy-caching src/apps/feed/main.ts || true
RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 2s deno run -A --cached-only --unstable-npm-lazy-caching src/apps/jobs/sync-releases/main.ts || true

RUN mkdir /app/data

VOLUME [ "/app/data" ]

EXPOSE 4321 4322 4323
