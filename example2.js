var fs = require('fs');
var unionfs = require('./index');
var memfs = require('../memfs/index');


var mem = new memfs.Volume;
mem.mountSync(__dirname, {
    'test.js': 'require("./a.js")',
    'a.js': 'console.log("aaa");'
});


unionfs
    .use(fs)
    .use(mem)
    .replace(fs);


require(__dirname + '/test.js');