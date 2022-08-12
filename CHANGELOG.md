### v3.1.0 (2022-08-12)

- [Add patch-package and patch `offline-github-changelog` to allow unlimited commits in changelog](https://github.com/M4RC3L05/music-follower/commit/96dc5a87abda82b36bf5d82dad70eb6162257178)
- [Update release sync to include release type and allow music relases from not released albums](https://github.com/M4RC3L05/music-follower/commit/a717720c6d3e9af9b8b9d015c5726299bb2e4750)
- [Make artists columns not nullable](https://github.com/M4RC3L05/music-follower/commit/488aa887cc8ca381adc5962de8cb306f7db10353)
- [Add migrations to add `type` column and create id+type unique index and make release columns not null](https://github.com/M4RC3L05/music-follower/commit/b9696d9358e4d2dd48094d341d932cfeac508412)
- [Add album and song release endpoints](https://github.com/M4RC3L05/music-follower/commit/34b3d72c7f69d21305133df527e5dad682497093)
- [Get host and port from config](https://github.com/M4RC3L05/music-follower/commit/a582bfce52fa1ff4ebc432c91bb2c7d5a07be809)
- [Fix typo in `sync-releases-task` log](https://github.com/M4RC3L05/music-follower/commit/e5ce5ba5c1308bccda76dbb2063ebe80d555dd48)
- [Log wen sending ready signal from `sync-releases-task`](https://github.com/M4RC3L05/music-follower/commit/f317c9a4d1b7de1b4dcd595e1e4cbd755004e9f9)
- [Bind kenx to objection in main in `sync-release-task`](https://github.com/M4RC3L05/music-follower/commit/20114e6d19400059d679c6dfd0f6f04837d96101)
- [Update lint command](https://github.com/M4RC3L05/music-follower/commit/6f2a2657a2a2ac4b9b41f850628bca77514d2cbd)
- [Update dependencies version](https://github.com/M4RC3L05/music-follower/commit/1321aef028eb2905c1af574a2377d31eba31146e)

### v3.0.0 (2022-08-10)

- [Revert "Replace better-sqlite3 to sqlite3"](https://github.com/M4RC3L05/music-follower/commit/2e26a7e03a3e15eea16b3ec7c6ac77994d1f6216)

### v2.0.0 (2022-08-10)

- [Replace better-sqlite3 to sqlite3](https://github.com/M4RC3L05/music-follower/commit/1eaa988f43ca0610763e44ef5d1dd4de4ecb524e)
- [Re add pm2 support](https://github.com/M4RC3L05/music-follower/commit/75fd4b8a5fc19dfaf4b55e8901a5426e9e5c5399)
- [Fix version command sed regex](https://github.com/M4RC3L05/music-follower/commit/8a9ff83ceb3b74b4bdb38c5e2e4386d2a3f9a296)

### v1.1.7 (2022-08-09)

- [Use `offline-github-changelog` and rever scripts](https://github.com/M4RC3L05/music-follower/commit/47ed4d663c02e9828aa7cb9bfff9f2025c633f7a)

### v1.1.6

- [Add `mjs` extension to lint staged](https://github.com/M4RC3L05/music-follower/commit/0b0c6302146ed75fdfb202ce5c2b094b71dc96fc)

### v1.1.5

- [Update release section on readme](https://github.com/M4RC3L05/music-follower/commit/285e31aad27d953c840454db5a0216f9db37d9c5)

### v1.1.4

- [Use zx for scrips](https://github.com/M4RC3L05/music-follower/commit/78c39f6a5a6f5885f8aac3b7187735d18e0b6038)

### v1.1.3

- [Add release script](https://github.com/M4RC3L05/music-follower/commit/8be3ad9bdd0f6915e0d2c63e242471c2af52c7d5)

### v1.1.2 (2022-08-09)

- [Use version instead of alias in tool-version](https://github.com/M4RC3L05/music-follower/commit/4e1c7f6b385041cb806c0d5efcbb03caa3cee8f0)

### v1.1.1 (2022-08-09)

- [Use in house changelog generator](https://github.com/M4RC3L05/music-follower/commit/652f8e5257b7a75b6f40d5387bd9d47a007d836b)

### v1.1.0 (2022-08-09)

- [Remove knex script and update config file](https://github.com/M4RC3L05/music-follower/commit/d6ec4204af294e34e0884520d681a358418f7c36)
- [Add husky and lint-staged](https://github.com/M4RC3L05/music-follower/commit/3cb14c5df3357e5edb06f2fe61c536075c57fa24)

### v1.0.0 (2022-08-09)

- [Replace changelog generator package](https://github.com/M4RC3L05/music-follower/commit/e54596f843f5f4a9297ba029a8399f1f90560ed3)
- [Fix `readme` typo and update deploy notes](https://github.com/M4RC3L05/music-follower/commit/8d363e3bef158206f090825a5b7eeea36b9c454b)
- [Add `.log` directory and remove pm2 dependencies](https://github.com/M4RC3L05/music-follower/commit/0e86931d62cd7b7ca6e1f2ac6fe3331e5f42c7fc)
- [Use iso string for time in logger](https://github.com/M4RC3L05/music-follower/commit/98462cb5b024dff98e73a2d709b526bea577095f)

### v0.2.1 (2022-08-09)

- [Fix import for `artist-repository`](https://github.com/M4RC3L05/music-follower/commit/b7b682c09f30ce695db50f53c2c4742ecdff199f)

### v0.2.0 (2022-08-09)

- [Improve README.md](https://github.com/M4RC3L05/music-follower/commit/5c5da5fafbebf4af541a9a14a792855ed6652c67)
- [Fix file typo and make `update-artists` use the `artists` repository](https://github.com/M4RC3L05/music-follower/commit/2dc03044c7caaff761a15c41d9366cf04a65c58d)

### v0.1.0 (2022-08-09)

- [Init commit](https://github.com/M4RC3L05/music-follower/commit/00543e0ba64d4d4329829206c7dc3b2cd68cc682)
