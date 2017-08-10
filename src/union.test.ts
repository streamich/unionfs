import {expect} from 'chai';
import {Union} from './union';
import {Volume} from 'memfs/src/volume';


describe('union', () => {
    describe('Union', () => {
        describe('sync methods', () => {
            it('Basic one file system', () => {
                const vol = Volume.fromJSON({'/foo': 'bar'});
                const ufs = new Union as any;
                ufs.use(vol);
                expect(ufs.readFileSync('/foo', 'utf8')).to.equal('bar');
            });
            it('File not found', () => {
                const vol = Volume.fromJSON({'/foo': 'bar'});
                const ufs = new Union as any;
                ufs.use(vol);
                try {
                    ufs.readFileSync('/not-found', 'utf8');
                    throw Error('This should not throw');
                } catch(err) {
                    expect(err.code).to.equal('ENOENT');
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
                    expect(err.message).to.not.equal('not_this');
                }
            });
        });
        describe('async methods', () => {
            it('Basic one file system', done => {
                const vol = Volume.fromJSON({'/foo': 'bar'});
                const ufs = new Union as any;
                ufs.use(vol);
                ufs.readFile('/foo', 'utf8', (err, data) => {
                    expect(err).to.equal(null);
                    expect(data).to.equal('bar');
                    done();
                });
            });
            it('File not found', done => {
                const vol = Volume.fromJSON({'/foo': 'bar'});
                const ufs = new Union as any;
                ufs.use(vol);
                ufs.readFile('/not-found', 'utf8', (err, data) => {
                    expect(err.code).to.equal('ENOENT');
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
                    expect(err).to.be.an.instanceof(TypeError);
                }
            });
            it('No file systems attached', done => {
                const ufs = new Union as any;
                ufs.stat('/foo2', 'utf8', (err, data) => {
                    expect(err.message).to.equal('No file systems attached.');
                    done();
                });
            });
        });
    });
});
