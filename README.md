# Music follower

A self host solution to watch for new artist releases.

## Setup

> This project uses nodejs 16.18.0

Install dependencies

```bash
npm i
```

## Development

```bash
npm run dev
```

## Deploy

> This projects manages it apps with pm2

Clone this project if the first time deploying.

After that make sure to checkout to the wanted version tag

```bash
git checkout v*.*.*
```

Deploy with your prefered system, example: pm2, systemd, etc...

### pm2

Duplicate the example files from `.pm2` directory and fill them with the correct values:
Then, start the services:

```bash
pm2 start/restart .pm2/<file.json> --update-env
```

## Release

```bash
npm version [major | minor | patch] -m "Release v%s"

git push origin main --tags
```
