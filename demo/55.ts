const { ufs } = require('../src/index');
const { Volume } = require('memfs');
const fs = require('fs');

ufs.use(fs).use(Volume.fromJSON({ 'foo.js': '' }, '/tmp'));

console.log(__filename);
console.log(ufs.existsSync(__filename)); // false
console.log(fs.existsSync(__filename)); // true
console.log(ufs.existsSync('/tmp/foo.js')); // true
