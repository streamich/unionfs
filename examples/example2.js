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
    .use(mem);
unionfs.replace(fs);


var path = __dirname + '/package.json';
// var path = __dirname + '/test.js';
console.log(fs.createReadStream.toString());
// var s = fs.createReadStream(path);
// s.addListener('data', function(data) {
//     console.log(data.toString());
// });



