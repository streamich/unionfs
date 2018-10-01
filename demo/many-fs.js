"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var memfs_1 = require("memfs");
var MemoryFileSystem = require("memory-fs");
var src_1 = require("../src");
var vol1 = memfs_1.Volume.fromJSON({ '/memfs-1': '1' });
var vol2 = memfs_1.Volume.fromJSON({ '/memfs-2': '2' });
var memoryFs = new MemoryFileSystem;
memoryFs.writeFileSync('/memory-fs', '3');
src_1.ufs
    .use(fs)
    .use(vol1)
    .use(vol2)
    .use(memoryFs);
console.log(src_1.ufs.readFileSync('./index.js', 'utf8'));
console.log(src_1.ufs.readFileSync('/memfs-1', 'utf8'));
console.log(src_1.ufs.readFileSync('/memfs-2', 'utf8'));
console.log(src_1.ufs.readFileSync('/memory-fs', 'utf8'));
