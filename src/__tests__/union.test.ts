import {Union} from '..';
import {Volume} from 'memfs/src/volume';
import * as fs from 'fs';
import { doesNotThrow } from 'assert';

describe('union', () => {
    describe('Union', () => {
        describe('sync methods', () => {
            it('Basic one file system', () => {
                const vol = Volume.fromJSON({'/foo': 'bar'});
                const ufs = new Union as any;
                ufs.use(vol);
                expect(ufs.readFileSync('/foo', 'utf8')).toBe('bar');
            });

            it('basic two filesystems', () => {
                const vol = Volume.fromJSON({'/foo': 'bar'});
                const vol2 = Volume.fromJSON({'/foo': 'baz'});
                const ufs = new Union as any;
                ufs.use(vol);
                ufs.use(vol2);

                expect(ufs.readFileSync('/foo', 'utf8')).toBe('baz');
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

            describe('existsSync()', () => {
                it('finds file on real file system', () => {
                    const ufs = new Union;

                    ufs
                        .use(fs as any)
                        .use(Volume.fromJSON({"foo.js": ""}, "/tmp") as any)

                    expect(ufs.existsSync(__filename)).toBe(true);
                    expect(fs.existsSync(__filename)).toBe(true);
                    expect(ufs.existsSync("/tmp/foo.js")).toBe(true);
                });
            });

            describe("readdirSync", () => {
                it('reads one memfs correctly', () => {
                    const vol = Volume.fromJSON({
                        '/foo/bar': 'bar',
                        '/foo/baz': 'baz',
                    });
                    const ufs = new Union();
                    ufs.use(vol as any);
                    expect(ufs.readdirSync("/foo")).toEqual(["bar", "baz"]);
                });
    
                it('reads multiple memfs correctly', () => {
                    const vol = Volume.fromJSON({
                        '/foo/bar': 'bar',
                        '/foo/baz': 'baz',
                    });
                    const vol2 = Volume.fromJSON({
                        '/foo/qux': 'baz',
                    });
                    
                    const ufs = new Union();
                    ufs.use(vol as any);
                    ufs.use(vol2 as any);
                    expect(ufs.readdirSync("/foo")).toEqual(["qux", "bar", "baz"]);
                });
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
            it('basic two filesystems', () => {
                const vol = Volume.fromJSON({'/foo': 'bar'});
                const vol2 = Volume.fromJSON({'/foo': 'baz'});
                const ufs = new Union as any;
                ufs.use(vol);
                ufs.use(vol2);
                ufs.readFile('/foo', 'utf8', (err, content) => {
                    expect(content).toBe('baz');
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

            it('callbacks are only called once', done => {
                const vol = Volume.fromJSON({
                    '/foo/bar': 'bar',
                });
                const vol2 = Volume.fromJSON({
                    '/foo/bar': 'baz',
                });
                
                const ufs = new Union() as any;
                ufs.use(vol as any);
                ufs.use(vol2 as any);

                const mockCallback = jest.fn();
                ufs.readFile("/foo/bar", "utf8", () => {
                    mockCallback();
                    expect(mockCallback).toBeCalledTimes(1);
                    done();
                });

            });

            describe("readdir", () => {
                it('reads one memfs correctly', () => {
                    const vol = Volume.fromJSON({
                        '/foo/bar': 'bar',
                        '/foo/baz': 'baz',
                    });
                    const ufs = new Union();
                    ufs.use(vol as any);
                    ufs.readdir("/foo", (err, files) => {
                        expect(files).toEqual(["bar", "baz"]);
                    });
                });
    
                it('reads multiple memfs correctly', done => {
                    const vol = Volume.fromJSON({
                        '/foo/bar': 'bar',
                        '/foo/baz': 'baz',
                    });
                    const vol2 = Volume.fromJSON({
                        '/foo/qux': 'baz',
                    });
                    
                    const ufs = new Union();
                    ufs.use(vol as any);
                    ufs.use(vol2 as any);
                    ufs.readdir("/foo", (err, files) => {
                        expect(files).toEqual(["qux", "bar", "baz"]);
                        done();
                    });
                });
            });
        });

        describe("Streams", () => {
            it("can create Readable Streams", () => {
                const vol = Volume.fromJSON({'/foo': 'bar'});
                const ufs = new Union as any;

                ufs.use(vol).use(fs);

                expect(ufs.createReadStream).toBeInstanceOf(Function);
                expect(vol.createReadStream("/foo")).toHaveProperty("_readableState");
                expect(fs.createReadStream(__filename)).toHaveProperty("_readableState");

                expect(ufs.createReadStream("/foo")).toHaveProperty("_readableState");
                expect(ufs.createReadStream(__filename)).toHaveProperty("_readableState");
            });

            it("can create Writable Streams", () => {
                const vol = Volume.fromJSON({'/foo': 'bar'});
                const ufs = new Union as any;
                const realFile = __filename+".test"
                ufs.use(vol).use(fs);

                expect(ufs.createWriteStream).toBeInstanceOf(Function);
                expect(vol.createWriteStream("/foo")).toHaveProperty("_writableState");
                expect(fs.createWriteStream(realFile)).toHaveProperty("_writableState");

                expect(ufs.createWriteStream("/foo")).toHaveProperty("_writableState");
                expect(ufs.createWriteStream(realFile)).toHaveProperty("_writableState");

                ufs.unlinkSync(realFile);
            })
        })
    });
});
