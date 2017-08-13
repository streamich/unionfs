"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var union_1 = require("./union");
var volume_1 = require("memfs/src/volume");
describe('union', function () {
    describe('Union', function () {
        describe('sync methods', function () {
            it('Basic one file system', function () {
                var vol = volume_1.Volume.fromJSON({ '/foo': 'bar' });
                var ufs = new union_1.Union;
                ufs.use(vol);
                chai_1.expect(ufs.readFileSync('/foo', 'utf8')).to.equal('bar');
            });
            it('File not found', function () {
                var vol = volume_1.Volume.fromJSON({ '/foo': 'bar' });
                var ufs = new union_1.Union;
                ufs.use(vol);
                try {
                    ufs.readFileSync('/not-found', 'utf8');
                    throw Error('This should not throw');
                }
                catch (err) {
                    chai_1.expect(err.code).to.equal('ENOENT');
                }
            });
            it('Method does not exist', function () {
                var vol = volume_1.Volume.fromJSON({ '/foo': 'bar' });
                var ufs = new union_1.Union;
                vol.readFileSync = undefined;
                ufs.use(vol);
                try {
                    ufs.readFileSync('/foo', 'utf8');
                    throw Error('not_this');
                }
                catch (err) {
                    chai_1.expect(err.message).to.not.equal('not_this');
                }
            });
        });
        describe('async methods', function () {
            it('Basic one file system', function (done) {
                var vol = volume_1.Volume.fromJSON({ '/foo': 'bar' });
                var ufs = new union_1.Union;
                ufs.use(vol);
                ufs.readFile('/foo', 'utf8', function (err, data) {
                    chai_1.expect(err).to.equal(null);
                    chai_1.expect(data).to.equal('bar');
                    done();
                });
            });
            it('File not found', function (done) {
                var vol = volume_1.Volume.fromJSON({ '/foo': 'bar' });
                var ufs = new union_1.Union;
                ufs.use(vol);
                ufs.readFile('/not-found', 'utf8', function (err, data) {
                    chai_1.expect(err.code).to.equal('ENOENT');
                    done();
                });
            });
            it('No callback provided', function () {
                var vol = volume_1.Volume.fromJSON({ '/foo': 'bar' });
                var ufs = new union_1.Union;
                ufs.use(vol);
                try {
                    ufs.stat('/foo2', 'utf8');
                }
                catch (err) {
                    chai_1.expect(err).to.be.an.instanceof(TypeError);
                }
            });
            it('No file systems attached', function (done) {
                var ufs = new union_1.Union;
                ufs.stat('/foo2', 'utf8', function (err, data) {
                    chai_1.expect(err.message).to.equal('No file systems attached.');
                    done();
                });
            });
        });
    });
});
