FROM docker.io/denoland/deno:alpine-2.4.4

RUN mkdir /app
RUN chown -R deno:deno /app

USER deno

WORKDIR /app

COPY --chown=deno:deno . .

RUN deno install --frozen --unstable-npm-lazy-caching --entrypoint src/apps/web/main.ts src/apps/jobs/sync-releases/main.ts src/apps/jobs/sync-artists-image/main.ts

RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 30s deno run -A --cached-only --frozen --unstable-npm-lazy-caching src/apps/web/main.ts || true
RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 30s deno run -A --cached-only --frozen --unstable-npm-lazy-caching src/apps/jobs/sync-releases/main.ts || true
RUN BUILD_DRY_RUN=true DATABASE_PATH=":memory:" timeout 30s deno run -A --cached-only --frozen --unstable-npm-lazy-caching src/apps/jobs/sync-artists-image/main.ts || true

RUN mkdir /app/data

VOLUME [ "/app/data" ]

EXPOSE 4321
