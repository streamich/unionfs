"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _a;
var union_1 = require("../src/union");
var volume_1 = require("../../memfs/src/volume");
var fs = require("fs");
var patchRequire = require('fs-monkey').patchRequire;
var vol = volume_1.Volume.fromJSON((_a = {}, _a[__dirname + '/fake.js'] = 'console.log("owned");', _a));
var ufs = new union_1.Union;
ufs
    .use(vol)
    .use(fs);
patchRequire(ufs);
require(__dirname + '/fake.js');
