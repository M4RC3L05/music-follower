FROM docker.io/node:18.17-alpine as build

USER node

WORKDIR /home/node/app

COPY --chown=node:node package.json ./
COPY --chown=node:node package-lock.json ./
RUN npm ci

COPY --chown=node:node ./src ./src
COPY --chown=node:node ./.swcrc ./.swcrc

RUN npx swc --copy-files --include-dotfiles ./src -d dist

FROM docker.io/node:18.17-alpine as final

USER node

WORKDIR /home/node/app

COPY --from=build --chown=node:node /home/node/app/package.json ./
COPY --from=build --chown=node:node /home/node/app/package-lock.json ./
RUN npm prune --omit=dev

COPY --from=build --chown=node:node /home/node/app/dist ./src
COPY --chown=node:node ./config ./config
RUN mkdir data

VOLUME [ "/home/node/app/data" ]

EXPOSE 4321 4322 4323
