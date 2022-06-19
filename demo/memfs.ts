import { Union } from '../src';
import { Volume } from 'memfs';
import * as fs from 'fs';

const vol1 = Volume.fromJSON({
  '/readme': 'hello',
});

const vol2 = Volume.fromJSON({
  '/dir/test/index.js': 'require("mocha")',
});

const ufs = new Union().use(vol1).use(vol2).use(fs);

console.log(ufs.readFileSync('/readme', 'utf8'));

ufs.readFile('/dir/test/index.js', (err, buf) => {
  console.log(err, String(buf));
});

console.log(ufs.readFileSync('./index.js', 'utf8'));
