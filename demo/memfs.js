"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var union_1 = require("../src/union");
var volume_1 = require("../../memfs/src/volume");
var fs = require("fs");
var vol1 = volume_1.Volume.fromJSON({
    '/readme': 'hello',
});
var vol2 = volume_1.Volume.fromJSON({
    '/dir/test/index.js': 'require("mocha")',
});
var ufs = new union_1.Union;
ufs
    .use(vol1)
    .use(vol2)
    .use(fs);
console.log(ufs.readFileSync('/readme', 'utf8'));
ufs.readFile('/dir/test/index.js', function (err, buf) {
    console.log(err, String(buf));
});
console.log(ufs.readFileSync('./index.js', 'utf8'));
