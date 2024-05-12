FROM docker.io/denoland/deno:alpine-1.43.3

EXPOSE 4321
WORKDIR /app

RUN mkdir data
RUN chown -R deno:deno ./data

USER deno

COPY . .

RUN deno task deps

VOLUME [ "/app/data" ]

EXPOSE 4321 4322 4323
