FROM docker.io/denoland/deno:alpine-2.1.3

RUN mkdir /app
RUN chown -R deno:deno /app

USER deno

WORKDIR /app

COPY --chown=deno:deno . .

RUN deno install --node-modules-dir --entrypoint src/apps/api/main.ts
RUN deno install --node-modules-dir --entrypoint src/apps/admin/main.ts
RUN deno install --node-modules-dir --entrypoint src/apps/feed/main.ts
RUN deno install --node-modules-dir --entrypoint src/apps/jobs/sync-releases/main.ts

RUN deno eval "import '@db/sqlite'"

RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 2s deno task api || true
RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 2s deno task admin || true
RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 2s deno task feed || true
RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 2s deno task jobs:sync-releases || true

RUN mkdir /app/data

VOLUME [ "/app/data" ]

EXPOSE 4321 4322 4323
