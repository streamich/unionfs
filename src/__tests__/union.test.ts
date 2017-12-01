import {Union} from '../union';
import {Volume} from 'memfs/src/volume';

describe('union', () => {
    describe('Union', () => {
        describe('sync methods', () => {
            it('Basic one file system', () => {
                const vol = Volume.fromJSON({'/foo': 'bar'});
                const ufs = new Union as any;
                ufs.use(vol);
                expect(ufs.readFileSync('/foo', 'utf8')).toBe('bar');
            });

            it('File not found', () => {
                const vol = Volume.fromJSON({'/foo': 'bar'});
                const ufs = new Union as any;
                ufs.use(vol);
                try {
                    ufs.readFileSync('/not-found', 'utf8');
                    throw Error('This should not throw');
                } catch(err) {
                    expect(err.code).toBe('ENOENT');
                }
            });

            it('Method does not exist', () => {
                const vol = Volume.fromJSON({'/foo': 'bar'});
                const ufs = new Union as any;
                vol.readFileSync = undefined;
                ufs.use(vol);
                try {
                    ufs.readFileSync('/foo', 'utf8');
                    throw Error('not_this');
                } catch(err) {
                    expect(err.message).not.toBe('not_this');
                }
            });
        });
        describe('async methods', () => {
            it('Basic one file system', done => {
                const vol = Volume.fromJSON({'/foo': 'bar'});
                const ufs = new Union as any;
                ufs.use(vol);
                ufs.readFile('/foo', 'utf8', (err, data) => {
                    expect(err).toBe(null);
                    expect(data).toBe('bar');
                    done();
                });
            });

            it('File not found', done => {
                const vol = Volume.fromJSON({'/foo': 'bar'});
                const ufs = new Union as any;
                ufs.use(vol);
                ufs.readFile('/not-found', 'utf8', (err, data) => {
                    expect(err.code).toBe('ENOENT');
                    done();
                });
            });

            it('No callback provided', () => {
                const vol = Volume.fromJSON({'/foo': 'bar'});
                const ufs = new Union as any;
                ufs.use(vol);
                try {
                    ufs.stat('/foo2', 'utf8');
                } catch(err) {
                    expect(err).toBeInstanceOf(TypeError);
                }
            });

            it('No file systems attached', done => {
                const ufs = new Union as any;
                ufs.stat('/foo2', 'utf8', (err, data) => {
                    expect(err.message).toBe('No file systems attached.');
                    done();
                });
            });
        });
    });
});
