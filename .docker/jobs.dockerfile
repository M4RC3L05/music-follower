FROM docker.io/node:18.17-alpine as build

USER node

WORKDIR /home/node/app

COPY --chown=node:node package.json ./
COPY --chown=node:node package-lock.json ./
RUN npm ci

COPY --chown=node:node ./bin ./bin
COPY --chown=node:node ./src/commands ./src/commands
COPY --chown=node:node ./src/common ./src/common
COPY --chown=node:node ./src/domain ./src/domain
COPY --chown=node:node ./src/remote ./src/remote
COPY --chown=node:node ./src/typedefs ./src/typedefs
COPY --chown=node:node ./src/apps/jobs ./src/apps/jobs
COPY --chown=node:node ./.swcrc ./.swcrc

RUN npx swc --copy-files --include-dotfiles ./src -d dist

FROM docker.io/node:18.17-alpine as final

USER node

WORKDIR /home/node/app

COPY --chown=node:node package.json ./
COPY --chown=node:node package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build --chown=node:node /home/node/app/dist ./src
COPY --from=build --chown=node:node /home/node/app/bin ./bin
COPY --chown=node:node ./config ./config

VOLUME [ "/home/node/app/data" ]
