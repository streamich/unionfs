import * as fs from 'fs';
import {Volume} from 'memfs';
import * as MemoryFileSystem from 'memory-fs';
import {ufs} from '../src'


const vol1 = Volume.fromJSON({'/memfs-1': '1'});
const vol2 = Volume.fromJSON({'/memfs-2': '2'});


const memoryFs = new MemoryFileSystem;
memoryFs.writeFileSync('/memory-fs', '3');


ufs
    .use(fs)
    .use(vol1)
    .use(vol2)
    .use(memoryFs);


console.log(ufs.readFileSync('./index.js', 'utf8'));
console.log(ufs.readFileSync('/memfs-1', 'utf8'));
console.log(ufs.readFileSync('/memfs-2', 'utf8'));
console.log(ufs.readFileSync('/memory-fs', 'utf8'));
