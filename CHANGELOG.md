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
