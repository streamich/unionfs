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


// var gfs = require('graceful-fs');

// gfs.createReadStream(__dirname + '/../package.json').on('data', function(data) {
//     console.log(data.toString());
// });

fs.createReadStream(__dirname + '/test.txt').on('data', function(data) {
    console.log(data.toString());
});
