FROM docker.io/denoland/deno:alpine-2.3.1

RUN mkdir /app
RUN chown -R deno:deno /app

USER deno

WORKDIR /app

COPY --chown=deno:deno . .

RUN deno install --unstable-npm-lazy-caching --entrypoint src/apps/api/main.ts src/apps/admin/main.ts src/apps/feed/main.ts src/apps/jobs/sync-releases/main.ts
RUN deno eval "import '@db/sqlite'"

RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 30s deno run -A --cached-only --unstable-npm-lazy-caching src/apps/api/main.ts || true
RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 30s deno run -A --cached-only --unstable-npm-lazy-caching src/apps/admin/main.ts || true
RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 30s deno run -A --cached-only --unstable-npm-lazy-caching src/apps/feed/main.ts || true
RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 30s deno run -A --cached-only --unstable-npm-lazy-caching src/apps/jobs/sync-releases/main.ts || true

RUN mkdir /app/data

VOLUME [ "/app/data" ]

EXPOSE 4321 4322 4323
