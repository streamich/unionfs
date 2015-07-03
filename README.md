# unionfs

Creates a union of multiple `fs` file systems.

This module allows you to use multiple objects that have file system `fs` API at the same time.

Use this module with [`memfs`](http://www.npmjs.com/package/memfs) and [`linkfs`](http://www.npmjs.com/package/linkfs).
`memfs` allows you to create virtual in-memory file system. `linkfs` allows you to rewrite `fs` paths.

```javascript
var fs = require('fs');
var unionfs = require('unionfs');
var linkfs = require('linkfs');
var memfs = require('memfs');


// Create a virtual file.
var mem = new memfs.Volume;
mem.mountSync('/usr/mem', {
    'dir/hello.js': 'console.log("Hello world!");'
});
console.log(mem.readFileSync('/usr/mem/dir/hello.js').toString());
// console.log("Hello world!");


// Create a filesystem whose paths are rewritten.
var link = linkfs(mem, {'/project': '/usr/mem/dir'});
console.log(link.readFileSync('/project/hello.js').toString());
// console.log("Hello world!");


// Combine three file systems, to create a union of file systems.
unionfs
    .use(fs)
    .use(mem)
    .use(link);
console.log(unionfs.readFileSync('/usr/mem/dir/hello.js').toString());
// console.log("Hello world!");
console.log(unionfs.readFileSync('/project/hello.js').toString());
// console.log("Hello world!");


// Rewrite the real `fs` module with `unionfs`.
unionfs.replace(fs);
console.log(fs.readFileSync('/usr/mem/dir/hello.js').toString());
// console.log("Hello world!");
console.log(fs.readFileSync('/project/hello.js').toString());
// console.log("Hello world!");


// Now you can also do:
require('/usr/mem/dir/hello.js');
// Hello world!
require('/project/hello.js');
// Hello world!
```

You can create a `unionfs` object manually, but then you have to call `init()` method at the very beginning:

```javascript
var unionfs = require('unionfs');

var ufs1 = new unionfs.UnionFS; 
ufs1
    .init()
    .use(fs)
    .use(mem);
    
var ufs2 = new unionfs.UnionFS;
ufs2
    .init()
    .use(fs)
    .use(/*...*/);
```


### Testing

    npm i
    mocha
    
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
