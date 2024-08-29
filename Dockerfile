FROM docker.io/denoland/deno:alpine-1.46.1

RUN mkdir /app
RUN chown -R deno:deno /app

USER deno

WORKDIR /app

COPY --chown=deno:deno . .
RUN mkdir /app/data

RUN deno task deps

VOLUME [ "/app/data" ]

EXPOSE 4321 4322 4323
