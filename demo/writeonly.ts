/**
 * This example overlays a writeonly memfs volume which will effectively "collect" write operations
 * and leave the underlying volume unchanged. This is useful for test suite scenarios
 *
 * Please also see [[../src/__tests__/union.test.ts]] for option examples
 */

import {ufs} from '../src';
import {Volume} from 'memfs';

const vol1 = Volume.fromJSON({
    '/underlying_file': 'hello',
});
const vol2 = Volume.fromJSON({});

ufs.use(vol1 as any).use(vol2 as any, {writable: false})
ufs.writeFileSync('/foo', 'bar')

console.log(vol2.readFileSync('/foo', 'utf8')) // bar
console.log(vol2.readFileSync('/underlying_file', 'utf8')) // error
