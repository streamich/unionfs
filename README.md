# unionfs

Combines multiple `fs` file systems.

This module allows you to use multiple objects that have file system `fs` API at the same time.

Example usage with [`memfs`](http://www.npmjs.com/package/memfs):

```javascript
var unionfs = require('unionfs');
var memfs = require('msmfs');
var fs = require('fs');

var mem = new memfs.Volume;
mem.mountSync('/memory', {
    "test.js": "console.log(123);",
    "dir/hello.js": "console.log('hello world');"
});

console.log(mem.readFileSync('/memory/test.js').toString()); // console.log(123);

unionfs
    .use(fs)
    .use(mem)
    .replace(fs);
    
require('/memory/dir/hello'); // 'hello world'
```
