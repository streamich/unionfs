import {Union} from '../src/union';
import {Volume} from '../../memfs/src/volume';
import * as fs from 'fs';
const {patchRequire} = require('fs-monkey');


const vol = Volume.fromJSON({[__dirname + '/fake.js']: 'console.log("owned");'});
const ufs = new Union as any;

ufs
    .use(vol)
    .use(fs);

patchRequire(ufs);
require(__dirname + '/fake.js');

