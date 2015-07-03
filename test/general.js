var expect = require('chai').expect;
var unionfs = require('../index');
var fs = require('fs');
var memfs = require('memfs');


var dir = __dirname + '/data';
var filepath = dir + '/hello.txt';

describe("single `fs`", function() {
    unionfs.use(fs);
    var ufs1 = unionfs;

    describe('sync', function() {
        it(".readFileSync()", function() {
            var buf_fs = fs.readFileSync(filepath);
            var buf = unionfs.readFileSync(filepath);
            expect(buf.toString()).to.equal(buf_fs.toString());
        });
    });

    describe('async', function() {

        it(".readFile()", function (done) {
            fs.readFile(filepath, function(err, buf_fs) {
                expect(err).to.equal(null);
                unionfs.readFile(filepath, function(err, buf) {
                    expect(err).to.equal(null);
                    expect(buf.toString()).to.equal(buf_fs.toString());
                    done();
                });
            });
        });

        it(".readdir()", function (done) {
            fs.readdir(dir, function(err, list_fs) {
                expect(err).to.equal(null);
                unionfs.readdir(dir, function(err, list) {
                    expect(err).to.equal(null);
                    expect(list).to.be.deep.equal(list_fs);
                    done();
                });
            });
        });

    });

});


describe('`fs` and `memfs`', function() {
    var mem = new memfs.Volume;
    var volume = {'virtual.txt': 'in-memory file'};
    mem.mountSync(dir, volume);

    var ufs2 = new unionfs.UnionFS;
    ufs2
        .init()
        .use(fs)
        .use(mem);

    describe('async', function() {
        it('.readFile()', function(done) {
            ufs2.readFile(dir + '/virtual.txt', function(err, buf) {
                expect(err).to.equal(null);
                expect(buf.toString()).to.equal(volume['virtual.txt']);
                done();
            });
        });
        it('.readdir()', function(done) {
            ufs2.readdir(dir, function(err, list) {
                expect(err).to.equal(null);
                expect(list).to.be.deep.equal(Object.keys(volume));
                done();
            });
        });
    });
});
