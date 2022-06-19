import { Union } from '../src';
import { Volume } from 'memfs';
import * as fs from 'fs';
const { patchRequire } = require('fs-monkey');

const vol = Volume.fromJSON({ [__dirname + '/fake.js']: 'console.log("owned");' });
const ufs = new Union().use(vol).use(fs);

patchRequire(ufs);
require(__dirname + '/fake.js');
