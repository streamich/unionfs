var fs = require('fs');
var unionfs = require('../index');
var memfs = require('../../memfs/index');


var mem = new memfs.Volume;
mem.mountSync(__dirname, {
    'test.txt': 'This is memfs',
});

unionfs
    .use(mem)
    .use(fs)
    .replace(fs);

var gfs = require('graceful-fs');

var path = __dirname + '/../package.json';
var path2 = __dirname + '/test.txt';

console.log(gfs.readFileSync(path).toString());
console.log(gfs.readFileSync(path2).toString());


