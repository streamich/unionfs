import { Union } from '..';
import { Volume, createFsFromVolume } from 'memfs';
import * as fs from 'fs';

function sleep(millisec: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    setTimeout(resolve, millisec);
  });
}

describe('union', () => {
  describe('Union', () => {
    describe('sync methods', () => {
      it('Basic one file system', () => {
        const vol = Volume.fromJSON({ '/foo': 'bar' });
        const ufs = new Union();
        ufs.use(vol as any);
        expect(ufs.readFileSync('/foo', 'utf8')).toBe('bar');
      });

      it('basic two filesystems', () => {
        const vol = Volume.fromJSON({ '/foo': 'bar' });
        const vol2 = Volume.fromJSON({ '/foo': 'baz' });
        const ufs = new Union();
        ufs.use(vol as any);
        ufs.use(vol2 as any);

        expect(ufs.readFileSync('/foo', 'utf8')).toBe('baz');
      });

      it('File not found', () => {
        const vol = Volume.fromJSON({ '/foo': 'bar' });
        const ufs = new Union();
        ufs.use(vol as any);
        try {
          ufs.readFileSync('/not-found', 'utf8');
          throw Error('This should not throw');
        } catch (err) {
          expect(err.code).toBe('ENOENT');
        }
      });

      it('Method does not exist', () => {
        const vol = Volume.fromJSON({ '/foo': 'bar' });
        const ufs = new Union();
        vol.readFileSync = undefined as any;
        ufs.use(vol as any);
        try {
          ufs.readFileSync('/foo', 'utf8');
          throw Error('not_this');
        } catch (err) {
          expect(err.message).not.toBe('not_this');
        }
      });

      describe('watch()', () => {
        it('should create a watcher', () => {
          const ufs = new Union().use(Volume.fromJSON({ 'foo.js': 'hello test' }, '/tmp') as any);

          const mockCallback = jest.fn();
          const writtenContent = 'hello world';
          const watcher = ufs.watch('/tmp/foo.js', mockCallback);

          ufs.writeFileSync('/tmp/foo.js', writtenContent);

          expect(mockCallback).toBeCalledTimes(2);
          expect(mockCallback).toBeCalledWith('change', '/tmp/foo.js');

          watcher.close();
        });

        it('can watchFile and unwatchFile', async () => {
          const memfs = Volume.fromJSON({ '/foo': '1' });
          const ufs = new Union().use(memfs as any);
          const mockCallback = jest.fn();
          ufs.watchFile('/foo', { interval: 10 }, mockCallback);

          await sleep(100);

          memfs.writeFileSync('/foo', '2');
          await sleep(100);
          expect(mockCallback).toBeCalled();
          mockCallback.mockClear();

          ufs.unwatchFile('/foo');
          memfs.writeFileSync('/foo', '3');
          await sleep(100);
          expect(mockCallback).not.toBeCalled();
        });
      });

      describe('existsSync()', () => {
        it('finds file on real file system', () => {
          const ufs = new Union();

          ufs.use(fs).use(Volume.fromJSON({ 'foo.js': '' }, '/tmp') as any);

          expect(ufs.existsSync(__filename)).toBe(true);
          expect(fs.existsSync(__filename)).toBe(true);
          expect(ufs.existsSync('/tmp/foo.js')).toBe(true);
        });
      });

      describe('readdirSync', () => {
        it('reads one memfs correctly', () => {
          const vol = Volume.fromJSON({
            '/foo/bar': 'bar',
            '/foo/baz': 'baz',
          });
          const ufs = new Union();
          ufs.use(vol as any);
          expect(ufs.readdirSync('/foo')).toEqual(['bar', 'baz']);
        });

        it('reads multiple memfs', () => {
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
          expect(ufs.readdirSync('/foo')).toEqual(['bar', 'baz', 'qux']);
        });

        it('reads dedupes multiple fss', () => {
          const vol = Volume.fromJSON({
            '/foo/bar': 'bar',
            '/foo/baz': 'baz',
          });
          const vol2 = Volume.fromJSON({
            '/foo/baz': 'not baz',
            '/foo/qux': 'baz',
          });

          const ufs = new Union();
          ufs.use(vol as any);
          ufs.use(vol2 as any);
          expect(ufs.readdirSync('/foo')).toEqual(['bar', 'baz', 'qux']);
        });

        it('reads other fss when one fails', () => {
          const vol = Volume.fromJSON({
            '/foo/bar': 'bar',
            '/foo/baz': 'baz',
          });
          const vol2 = Volume.fromJSON({
            '/bar/baz': 'not baz',
            '/bar/qux': 'baz',
          });

          const ufs = new Union();
          ufs.use(vol as any);
          ufs.use(vol2 as any);
          expect(ufs.readdirSync('/bar')).toEqual(['baz', 'qux']);
        });

        it('reads other fss when one fails -- in both orders', () => {
          const vol = Volume.fromJSON({});
          const vol2 = Volume.fromJSON({});
          vol2.mkdirSync('/b')
          const ufs = new Union();
          ufs.use(vol as any);
          ufs.use(vol2 as any);
          expect(ufs.readdirSync('/b')).toEqual([]);

          const ufs2 = new Union();
          ufs2.use(vol2 as any);
          ufs2.use(vol as any);
          expect(ufs2.readdirSync('/b')).toEqual([]);
        });

        it('honors the withFileTypes: true option', () => {
          const vol = Volume.fromJSON({
            '/foo/bar': 'bar',
            '/foo/zzz': 'zzz',
            '/foo/baz': 'baz',
          });

          const ufs = new Union();
          ufs.use(vol as any);
          const files = ufs.readdirSync('/foo', { withFileTypes: true });
          expect(files[0]).toBeInstanceOf(createFsFromVolume(vol).Dirent);
          expect(files.map(f => f.name)).toEqual(['bar', 'baz', 'zzz']);
        });

        it('throws error when all fss fail', () => {
          const vol = Volume.fromJSON({});
          const vol2 = Volume.fromJSON({});

          const ufs = new Union();
          ufs.use(vol as any);
          ufs.use(vol2 as any);
          expect(() => ufs.readdirSync('/bar')).toThrow();
        });
      });
    });
    describe('async methods', () => {
      it('Basic one file system', done => {
        const vol = Volume.fromJSON({ '/foo': 'bar' });
        const ufs = new Union();
        ufs.use(vol as any);
        ufs.readFile('/foo', 'utf8', (err, data) => {
          expect(err).toBe(null);
          expect(data).toBe('bar');
          done();
        });
      });
      it('basic two filesystems', () => {
        const vol = Volume.fromJSON({ '/foo': 'bar' });
        const vol2 = Volume.fromJSON({ '/foo': 'baz' });
        const ufs = new Union();
        ufs.use(vol as any);
        ufs.use(vol2 as any);
        ufs.readFile('/foo', 'utf8', (err, content) => {
          expect(content).toBe('baz');
        });
      });
      it('File not found', done => {
        const vol = Volume.fromJSON({ '/foo': 'bar' });
        const ufs = new Union();
        ufs.use(vol as any);
        ufs.readFile('/not-found', 'utf8', (err, data) => {
          expect(err?.code).toBe('ENOENT');
          done();
        });
      });

      it('No callback provided', () => {
        const vol = Volume.fromJSON({ '/foo': 'bar' });
        const ufs = new Union();
        ufs.use(vol as any);
        try {
          ufs.stat('/foo2', undefined as any);
        } catch (err) {
          expect(err).toBeInstanceOf(TypeError);
        }
      });

      it('No file systems attached', done => {
        const ufs = new Union();
        ufs.stat('/foo2', (err, data) => {
          expect(err?.message).toBe('No file systems attached.');
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

        const ufs = new Union();
        ufs.use(vol as any);
        ufs.use(vol2 as any);

        const mockCallback = jest.fn();
        ufs.readFile('/foo/bar', 'utf8', () => {
          mockCallback();
          expect(mockCallback).toBeCalledTimes(1);
          done();
        });
      });

      describe('readdir', () => {
        it('reads one memfs correctly', () => {
          const vol = Volume.fromJSON({
            '/foo/bar': 'bar',
            '/foo/baz': 'baz',
          });
          const ufs = new Union();
          ufs.use(vol as any);
          ufs.readdir('/foo', (err, files) => {
            expect(files).toEqual(['bar', 'baz']);
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
          ufs.readdir('/foo', (err, files) => {
            expect(err).toBeNull();
            expect(files).toEqual(['bar', 'baz', 'qux']);
            done();
          });
        });

        it('reads other fss when one fails', done => {
          const vol = Volume.fromJSON({
            '/foo/bar': 'bar',
            '/foo/baz': 'baz',
          });
          const vol2 = Volume.fromJSON({
            '/bar/baz': 'not baz',
            '/bar/qux': 'baz',
          });

          const ufs = new Union();
          ufs.use(vol as any);
          ufs.use(vol2 as any);
          ufs.readdir('/bar', (err, files) => {
            expect(err).toBeNull();
            expect(files).toEqual(['baz', 'qux']);
            done();
          });
        });

        it('honors the withFileTypes: true option', done => {
          const vol = Volume.fromJSON({
            '/foo/bar': 'bar',
            '/foo/zzz': 'zzz',
            '/foo/baz': 'baz',
          });

          const ufs = new Union();
          ufs.use(vol as any);
          ufs.readdir('/foo', { withFileTypes: true }, (err, files) => {
            expect(files[0]).toBeInstanceOf(createFsFromVolume(vol).Dirent);
            expect(files.map(f => f.name)).toEqual(['bar', 'baz', 'zzz']);
            done();
          });
        });

        it('throws error when all fss fail', done => {
          const vol = Volume.fromJSON({});
          const vol2 = Volume.fromJSON({});

          const ufs = new Union();
          ufs.use(vol as any);
          ufs.use(vol2 as any);
          ufs.readdir('/bar', (err, files) => {
            expect(err).not.toBeNull();
            done();
          });
        });
      });
    });
    describe('promise methods', () => {
      it('Basic one file system', async () => {
        const vol = Volume.fromJSON({ '/foo': 'bar' });
        const ufs = new Union();
        ufs.use(vol as any);
        await expect(ufs.promises.readFile('/foo', 'utf8')).resolves.toBe('bar');
      });

      it('basic two filesystems', async () => {
        const vol = Volume.fromJSON({ '/foo': 'bar' });
        const vol2 = Volume.fromJSON({ '/foo': 'baz' });
        const ufs = new Union();
        ufs.use(vol as any);
        ufs.use(vol2 as any);

        await expect(ufs.promises.readFile('/foo', 'utf8')).resolves.toBe('baz');
      });

      it('File not found', async () => {
        const vol = Volume.fromJSON({ '/foo': 'bar' });
        const ufs = new Union();
        ufs.use(vol as any);
        await expect(ufs.promises.readFile('/not-found', 'utf8')).rejects.toThrowError('ENOENT');
      });

      it('Method does not exist', async () => {
        const vol = Volume.fromJSON({ '/foo': 'bar' });
        const ufs = new Union();
        vol.promises.readFile = undefined as any;
        ufs.use(vol as any);
        await expect(ufs.promises.readFile('/foo', 'utf8')).rejects.toThrowError();
      });

      describe('readdir', () => {
        it('reads one memfs correctly', async () => {
          const vol = Volume.fromJSON({
            '/foo/bar': 'bar',
            '/foo/baz': 'baz',
          });
          const ufs = new Union();
          ufs.use(vol as any);
          await expect(ufs.promises.readdir('/foo')).resolves.toEqual(['bar', 'baz']);
        });

        it('reads multiple memfs', async () => {
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
          await expect(ufs.promises.readdir('/foo')).resolves.toEqual(['bar', 'baz', 'qux']);
        });

        it('reads dedupes multiple fss', async () => {
          const vol = Volume.fromJSON({
            '/foo/bar': 'bar',
            '/foo/baz': 'baz',
          });
          const vol2 = Volume.fromJSON({
            '/foo/baz': 'not baz',
            '/foo/qux': 'baz',
          });

          const ufs = new Union();
          ufs.use(vol as any);
          ufs.use(vol2 as any);
          await expect(ufs.promises.readdir('/foo')).resolves.toEqual(['bar', 'baz', 'qux']);
        });

        it('reads other fss when one fails', async () => {
          const vol = Volume.fromJSON({
            '/foo/bar': 'bar',
            '/foo/baz': 'baz',
          });
          const vol2 = Volume.fromJSON({
            '/bar/baz': 'not baz',
            '/bar/qux': 'baz',
          });

          const ufs = new Union();
          ufs.use(vol as any);
          ufs.use(vol2 as any);
          await expect(ufs.promises.readdir('/bar')).resolves.toEqual(['baz', 'qux']);
        });

        it('honors the withFileTypes: true option', async () => {
          const vol = Volume.fromJSON({
            '/foo/bar': 'bar',
            '/foo/zzz': 'zzz',
            '/foo/baz': 'baz',
          });

          const ufs = new Union();
          ufs.use(vol as any);
          const files = await ufs.promises.readdir('/foo', { withFileTypes: true });
          expect(files[0]).toBeInstanceOf(createFsFromVolume(vol).Dirent);
          expect(files.map(f => f.name)).toEqual(['bar', 'baz', 'zzz']);
        });

        it('throws error when all fss fail', async () => {
          const vol = Volume.fromJSON({});
          const vol2 = Volume.fromJSON({});

          const ufs = new Union();
          ufs.use(vol as any);
          ufs.use(vol2 as any);
          await expect(ufs.promises.readdir('/bar')).rejects.toThrow();
        });
      });
    });

    describe('Streams', () => {
      it('can create Readable Streams', () => {
        const vol = Volume.fromJSON({ '/foo': 'bar' });
        const ufs = new Union();

        ufs.use(vol as any).use(fs);

        expect(ufs.createReadStream).toBeInstanceOf(Function);
        expect(vol.createReadStream('/foo')).toHaveProperty('_readableState');
        expect(fs.createReadStream(__filename)).toHaveProperty('_readableState');

        expect(ufs.createReadStream('/foo')).toHaveProperty('_readableState');
        expect(ufs.createReadStream(__filename)).toHaveProperty('_readableState');
      });

      it('can create Writable Streams', async () => {
        const vol = Volume.fromJSON({ '/foo': 'bar' });
        const ufs = new Union();
        const realFile = __filename + '.test';
        ufs.use(vol as any).use(fs);

        expect(ufs.createWriteStream).toBeInstanceOf(Function);
        expect(vol.createWriteStream('/foo')).toHaveProperty('_writableState');
        expect(fs.createWriteStream(realFile)).toHaveProperty('_writableState');

        await sleep(100);

        expect(ufs.createWriteStream('/foo')).toHaveProperty('_writableState');
        expect(ufs.createWriteStream(realFile)).toHaveProperty('_writableState');

        await sleep(100);

        ufs.unlinkSync(realFile);
      });
    });
  });
});
