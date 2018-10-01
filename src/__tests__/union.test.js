"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
var volume_1 = require("memfs/src/volume");
var fs = require("fs");
describe('union', function () {
    describe('Union', function () {
        describe('sync methods', function () {
            it('Basic one file system', function () {
                var vol = volume_1.Volume.fromJSON({ '/foo': 'bar' });
                var ufs = new __1.Union;
                ufs.use(vol);
                expect(ufs.readFileSync('/foo', 'utf8')).toBe('bar');
            });
            it('basic two filesystems', function () {
                var vol = volume_1.Volume.fromJSON({ '/foo': 'bar' });
                var vol2 = volume_1.Volume.fromJSON({ '/foo': 'baz' });
                var ufs = new __1.Union;
                ufs.use(vol);
                ufs.use(vol2);
                expect(ufs.readFileSync('/foo', 'utf8')).toBe('baz');
            });
            it('File not found', function () {
                var vol = volume_1.Volume.fromJSON({ '/foo': 'bar' });
                var ufs = new __1.Union;
                ufs.use(vol);
                try {
                    ufs.readFileSync('/not-found', 'utf8');
                    throw Error('This should not throw');
                }
                catch (err) {
                    expect(err.code).toBe('ENOENT');
                }
            });
            it('Method does not exist', function () {
                var vol = volume_1.Volume.fromJSON({ '/foo': 'bar' });
                var ufs = new __1.Union;
                vol.readFileSync = undefined;
                ufs.use(vol);
                try {
                    ufs.readFileSync('/foo', 'utf8');
                    throw Error('not_this');
                }
                catch (err) {
                    expect(err.message).not.toBe('not_this');
                }
            });
            describe('existsSync()', function () {
                it('finds file on real file system', function () {
                    var ufs = new __1.Union;
                    ufs
                        .use(fs)
                        .use(volume_1.Volume.fromJSON({ "foo.js": "" }, "/tmp"));
                    expect(ufs.existsSync(__filename)).toBe(true);
                    expect(fs.existsSync(__filename)).toBe(true);
                    expect(ufs.existsSync("/tmp/foo.js")).toBe(true);
                });
            });
            describe("readdirSync", function () {
                it('reads one memfs correctly', function () {
                    var vol = volume_1.Volume.fromJSON({
                        '/foo/bar': 'bar',
                        '/foo/baz': 'baz',
                    });
                    var ufs = new __1.Union();
                    ufs.use(vol);
                    expect(ufs.readdirSync("/foo")).toEqual(["bar", "baz"]);
                });
                it('reads multiple memfs', function () {
                    var vol = volume_1.Volume.fromJSON({
                        '/foo/bar': 'bar',
                        '/foo/baz': 'baz',
                    });
                    var vol2 = volume_1.Volume.fromJSON({
                        '/foo/qux': 'baz',
                    });
                    var ufs = new __1.Union();
                    ufs.use(vol);
                    ufs.use(vol2);
                    expect(ufs.readdirSync("/foo")).toEqual(["bar", "baz", "qux"]);
                });
                it('reads dedupes multiple fss', function () {
                    var vol = volume_1.Volume.fromJSON({
                        '/foo/bar': 'bar',
                        '/foo/baz': 'baz',
                    });
                    var vol2 = volume_1.Volume.fromJSON({
                        '/foo/baz': 'not baz',
                        '/foo/qux': 'baz',
                    });
                    var ufs = new __1.Union();
                    ufs.use(vol);
                    ufs.use(vol2);
                    expect(ufs.readdirSync("/foo")).toEqual(["bar", "baz", "qux"]);
                });
            });
        });
        describe('async methods', function () {
            it('Basic one file system', function (done) {
                var vol = volume_1.Volume.fromJSON({ '/foo': 'bar' });
                var ufs = new __1.Union;
                ufs.use(vol);
                ufs.readFile('/foo', 'utf8', function (err, data) {
                    expect(err).toBe(null);
                    expect(data).toBe('bar');
                    done();
                });
            });
            it('basic two filesystems', function () {
                var vol = volume_1.Volume.fromJSON({ '/foo': 'bar' });
                var vol2 = volume_1.Volume.fromJSON({ '/foo': 'baz' });
                var ufs = new __1.Union;
                ufs.use(vol);
                ufs.use(vol2);
                ufs.readFile('/foo', 'utf8', function (err, content) {
                    expect(content).toBe('baz');
                });
            });
            it('File not found', function (done) {
                var vol = volume_1.Volume.fromJSON({ '/foo': 'bar' });
                var ufs = new __1.Union;
                ufs.use(vol);
                ufs.readFile('/not-found', 'utf8', function (err, data) {
                    expect(err.code).toBe('ENOENT');
                    done();
                });
            });
            it('No callback provided', function () {
                var vol = volume_1.Volume.fromJSON({ '/foo': 'bar' });
                var ufs = new __1.Union;
                ufs.use(vol);
                try {
                    ufs.stat('/foo2', 'utf8');
                }
                catch (err) {
                    expect(err).toBeInstanceOf(TypeError);
                }
            });
            it('No file systems attached', function (done) {
                var ufs = new __1.Union;
                ufs.stat('/foo2', 'utf8', function (err, data) {
                    expect(err.message).toBe('No file systems attached.');
                    done();
                });
            });
            it('callbacks are only called once', function (done) {
                var vol = volume_1.Volume.fromJSON({
                    '/foo/bar': 'bar',
                });
                var vol2 = volume_1.Volume.fromJSON({
                    '/foo/bar': 'baz',
                });
                var ufs = new __1.Union();
                ufs.use(vol);
                ufs.use(vol2);
                var mockCallback = jest.fn();
                ufs.readFile("/foo/bar", "utf8", function () {
                    mockCallback();
                    expect(mockCallback).toBeCalledTimes(1);
                    done();
                });
            });
            describe("readdir", function () {
                it('reads one memfs correctly', function () {
                    var vol = volume_1.Volume.fromJSON({
                        '/foo/bar': 'bar',
                        '/foo/baz': 'baz',
                    });
                    var ufs = new __1.Union();
                    ufs.use(vol);
                    ufs.readdir("/foo", function (err, files) {
                        expect(files).toEqual(["bar", "baz"]);
                    });
                });
                it('reads multiple memfs correctly', function (done) {
                    var vol = volume_1.Volume.fromJSON({
                        '/foo/bar': 'bar',
                        '/foo/baz': 'baz',
                    });
                    var vol2 = volume_1.Volume.fromJSON({
                        '/foo/qux': 'baz',
                    });
                    var ufs = new __1.Union();
                    ufs.use(vol);
                    ufs.use(vol2);
                    ufs.readdir("/foo", function (err, files) {
                        expect(err).toBeNull();
                        expect(files).toEqual(["bar", "baz", "qux"]);
                        done();
                    });
                });
            });
        });
        describe("Streams", function () {
            it("can create Readable Streams", function () {
                var vol = volume_1.Volume.fromJSON({ '/foo': 'bar' });
                var ufs = new __1.Union;
                ufs.use(vol).use(fs);
                expect(ufs.createReadStream).toBeInstanceOf(Function);
                expect(vol.createReadStream("/foo")).toHaveProperty("_readableState");
                expect(fs.createReadStream(__filename)).toHaveProperty("_readableState");
                expect(ufs.createReadStream("/foo")).toHaveProperty("_readableState");
                expect(ufs.createReadStream(__filename)).toHaveProperty("_readableState");
            });
            it("can create Writable Streams", function () {
                var vol = volume_1.Volume.fromJSON({ '/foo': 'bar' });
                var ufs = new __1.Union;
                var realFile = __filename + ".test";
                ufs.use(vol).use(fs);
                expect(ufs.createWriteStream).toBeInstanceOf(Function);
                expect(vol.createWriteStream("/foo")).toHaveProperty("_writableState");
                expect(fs.createWriteStream(realFile)).toHaveProperty("_writableState");
                expect(ufs.createWriteStream("/foo")).toHaveProperty("_writableState");
                expect(ufs.createWriteStream(realFile)).toHaveProperty("_writableState");
                ufs.unlinkSync(realFile);
            });
        });
    });
});
