FROM docker.io/denoland/deno:alpine-2.1.2

RUN mkdir /app
RUN chown -R deno:deno /app

USER deno

WORKDIR /app

COPY --chown=deno:deno deno.json deno.lock .
RUN deno install --node-modules-dir
RUN deno eval "import '@db/sqlite'"

COPY --chown=deno:deno . .
RUN mkdir /app/data

VOLUME [ "/app/data" ]

EXPOSE 4321 4322 4323
