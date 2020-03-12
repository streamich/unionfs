# [4.4.0](https://github.com/streamich/unionfs/compare/v4.3.2...v4.4.0) (2020-03-12)


### Features

* support `withFileTypes` option for `readdir` methods ([23472d7](https://github.com/streamich/unionfs/commit/23472d7cedd67f9e4e830883d28aa5118cb2d739))

## [4.3.2](https://github.com/streamich/unionfs/compare/v4.3.1...v4.3.2) (2020-02-17)


### Bug Fixes

* **deps:** update dependency fs-monkey to v1 ([db853bd](https://github.com/streamich/unionfs/commit/db853bdddc1a252da8717496f85d4def6cb418a1))

## [4.3.1](https://github.com/streamich/unionfs/compare/v4.3.0...v4.3.1) (2020-02-15)


### Bug Fixes

* generate type definitions ([0f87f53](https://github.com/streamich/unionfs/commit/0f87f53ecd96fa5c3fed8c9813f66eb5c5921cc8))

# [4.3.0](https://github.com/streamich/unionfs/compare/v4.2.1...v4.3.0) (2020-02-15)


### Features

* support `promises` namespace ([f7bd521](https://github.com/streamich/unionfs/commit/f7bd521b09a6c8d7a212a09670b6938b5f5eff9b))

## [4.2.1](https://github.com/streamich/unionfs/compare/v4.2.0...v4.2.1) (2019-12-19)


### Bug Fixes

* **readdir:** 🐛  Error no such file or directory ([8d21e9a](https://github.com/streamich/unionfs/commit/8d21e9a6b38fbd818227cb19806142ffaca1eca9))
* **readdirSync:** 🐛  Error no such file or directory ([b6c5764](https://github.com/streamich/unionfs/commit/b6c5764cb17b94184070d0c4acaac35c3292e365)), closes [#240](https://github.com/streamich/unionfs/issues/240)

# [4.2.0](https://github.com/streamich/unionfs/compare/v4.1.0...v4.2.0) (2019-03-02)


### Bug Fixes

* 🐛 bind methods ([b23f09c](https://github.com/streamich/unionfs/commit/b23f09c))


### Features

* 🎸 upgrade dependecies ([91635f8](https://github.com/streamich/unionfs/commit/91635f8))

# [4.1.0](https://github.com/streamich/unionfs.git/compare/v4.0.0...v4.1.0) (2019-03-01)


### Features

* improve typings ([75a5d69](https://github.com/streamich/unionfs.git/commit/75a5d69))

# [4.0.0](https://github.com/streamich/unionfs.git/compare/v3.0.2...v4.0.0) (2019-01-30)


### Bug Fixes

* **deps:** update dependency fs-monkey to ^0.3.0 ([c19864e](https://github.com/streamich/unionfs.git/commit/c19864e))


### Features

* 🎸 re-enable semantic-release ([5dc0842](https://github.com/streamich/unionfs.git/commit/5dc0842))
* make readdir merge results from all file systems ([347d2b0](https://github.com/streamich/unionfs.git/commit/347d2b0))
* refactor and improve watch() implementation ([6b9a3f2](https://github.com/streamich/unionfs.git/commit/6b9a3f2))


### BREAKING CHANGES

* behaviour of `watchFile()` and `unwatchFile()` changes.
* readdir now behaves differently

* add implementation of readdir and readdirSync

* tidy up code from review

* corectly dedupe readdir for multiple fss

* sort results from readdir
