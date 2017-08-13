# unionfs

Creates a union of multiple `fs` file systems.

[![][npm-img]][npm-url]

This module allows you to use multiple objects that have file system `fs` API at the same time.

```js
import {ufs} from 'unionfs';
import {fs as fs1} from 'memfs';
import * as fs2 from 'fs';

ufs
    .use(fs1)
    .use(fs2);

ufs.readFileSync(/* ... */);
```

Use this module with [`memfs`](http://www.npmjs.com/package/memfs) and [`linkfs`](http://www.npmjs.com/package/linkfs). 
`memfs` allows you to create virtual in-memory file system. `linkfs` allows you to redirect `fs` paths.

You can also use other *fs-like* objects.

```js
import * as fs from 'fs';
import {Volume} from 'memfs';
import * as MemoryFileSystem from 'memory-fs';
import {ufs} from 'unionfs'


const vol1 = Volume.fromJSON({'/memfs-1': '1'});
const vol2 = Volume.fromJSON({'/memfs-2': '2'});


const memoryFs = new MemoryFileSystem;
memoryFs.writeFileSync('/memory-fs', '3');


ufs
    .use(fs)
    .use(vol1)
    .use(vol2)
    .use(memoryFs);

console.log(ufs.readFileSync('/memfs-1', 'utf8')); // 1
console.log(ufs.readFileSync('/memfs-2', 'utf8')); // 2
console.log(ufs.readFileSync('/memory-fs', 'utf8')); // 3
```

You can create a `Union` instance manually:

```javascript
import {Union} from 'unionfs';

var ufs1 = new Union;
ufs1
    .use(fs)
    .use(vol);
    
var ufs2 = new Union;
ufs2
    .use(fs)
    .use(/*...*/);
```


[npm-url]: https://www.npmjs.com/package/unionfs
[npm-img]: https://img.shields.io/npm/v/unionfs.svg
[memfs]: https://github.com/streamich/memfs
[unionfs]: https://github.com/streamich/unionfs
[linkfs]: https://github.com/streamich/linkfs
[fs-monkey]: https://github.com/streamich/fs-monkey


    
# License

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
