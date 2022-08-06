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

Replicate pm2 config from the example config in pm2/apps and fill with the correct configuration.

Deploy with pm2

```bash
# restart all apps
pm2 restart pm2/apps/rss/main.json pm2/apps/rss/main.json --update-env

# restart specific app
pm2 restart pm2/apps/rss/main.json --update-env
```

The RSS feed will be available ast the root of the domain.

## Release

```bash
npm version [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease | from-git] -m "Release %s"

git push origin main --tags
```
