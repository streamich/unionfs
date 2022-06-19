# unionfs

Creates a union of multiple `fs` file systems.

[![][npm-img]][npm-url] [![][travis-badge]][travis-url]

    npm install --save unionfs

This module allows you to use multiple objects that have file system `fs` API at the same time.

```js
import { ufs } from 'unionfs';
import { fs as fs1 } from 'memfs';
import * as fs2 from 'fs';

ufs.use(fs1).use(fs2);

ufs.readFileSync(/* ... */);
```

Use this module with [`memfs`][memfs] and [`linkfs`][linkfs].
`memfs` allows you to create virtual in-memory file system. `linkfs` allows you to redirect `fs` paths.

You can also use other _fs-like_ objects.

```js
import * as fs from 'fs';
import { Volume } from 'memfs';
import * as MemoryFileSystem from 'memory-fs';
import { ufs } from 'unionfs';

const vol1 = Volume.fromJSON({ '/memfs-1': '1' });
const vol2 = Volume.fromJSON({ '/memfs-2': '2' });

const memoryFs = new MemoryFileSystem();
memoryFs.writeFileSync('/memory-fs', '3');

ufs.use(fs).use(vol1).use(vol2).use(memoryFs);

console.log(ufs.readFileSync('/memfs-1', 'utf8')); // 1
console.log(ufs.readFileSync('/memfs-2', 'utf8')); // 2
console.log(ufs.readFileSync('/memory-fs', 'utf8')); // 3
```

You can create a `Union` instance manually:

```javascript
import { Union } from 'unionfs';

var ufs1 = new Union();
ufs1.use(fs).use(vol);

var ufs2 = new Union();
ufs2.use(fs).use(/*...*/);
```

[npm-url]: https://www.npmjs.com/package/unionfs
[npm-img]: https://img.shields.io/npm/v/unionfs.svg
[memfs]: https://github.com/streamich/memfs
[unionfs]: https://github.com/streamich/unionfs
[linkfs]: https://github.com/streamich/linkfs
[fs-monkey]: https://github.com/streamich/fs-monkey
[travis-url]: https://travis-ci.org/streamich/unionfs
[travis-badge]: https://travis-ci.org/streamich/unionfs.svg?branch=master

# License

[Unlicense](./LICENSE) - public domain.
