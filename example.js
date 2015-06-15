var fs = require('fs');
var unionfs = require('./index');
var linkfs = require('../linkfs/index');
var memfs = require('../memfs/index');


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
