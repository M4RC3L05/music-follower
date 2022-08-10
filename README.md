# Music follower

A self host solution to watch for new artist releases.

## Setup

> This project uses nodejs 16.16.0

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

Import some artists by creating `database/data/artists.json`, example:

```jsonc
[
  {
    "id": 123, // itunes/apple music artist id
    "name": "foo",
    "imageUrl": "https://...."
  }
  // ....
]
```

and then import them:

```bash
npm run transpile && node dist/commands/update-artits.js
```

After that make sure to checkout to the wanted version tag

```bash
git checkout v*.*.*
```

Cleanup and transpilation

```bash
npm run clean && npm run transpile
```

Deploy with your prefered system, example: pm2, systemd, etc...

The RSS feed will be available at the root of the domain.

### pm2

Duplicate the example files from `.pm2` directory and fill them with the correct values:
Then, start the services:

```bash
pm2 start/restart .pm2/rss --update-env
```

## Release

```bash
npm version [major | minor | patch] -m "Release v%s"

git push origin main --tags
```
