

interface IFS {
    FSWatcher: any;
    ReadStream: any;
    WriteStream: any;
    Stats: any;
    readFileSync();
    renameSync();
    ftruncateSync();
    truncateSync();
    chownSync();
    fchownSync();
    lchownSync();
    chmodSync();
    fchmodSync();
    lchmodSync();
    statSync();
    lstatSync();
    fstatSync();
    linkSync();
    symlinkSync();
    readlinkSync();
    realpathSync();
    unlinkSync();
    rmdirSync();
    mkdirSync();
    readdirSync();
    closeSync();
    openSync();
    utimesSync();
    futimesSync();
    fsyncSync();
    writeSync();
    readSync();
    readFileSync();
    writeFileSync();
    appendFileSync();
    existsSync();
    accessSync();
    createReadStream();
    createWriteStream();
    watchFile();
    unwatchFile();
    watch();
    rename();
    ftruncate();
    truncate();
    chown();
    fchown();
    lchown();
    chmod();
    fchmod();
    lchmod();
    stat();
    lstat();
    fstat();
    link();
    symlink();
    readlink();
    realpath();
    unlink();
    rmdir();
    mkdir();
    readdir();
    close();
    open();
    utimes();
    futimes();
    fsync();
    write();
    read();
    readFile();
    writeFile();
    appendFile();
    exists();
    access();
}


class UnionFS {

    private static _props = [
        'FSWatcher',
        'ReadStream',
        'WriteStream',
        'Stats',
    ];

    private static _sync = [
        'renameSync',
        'ftruncateSync',
        'truncateSync',
        'chownSync',
        'fchownSync',
        'lchownSync',
        'chmodSync',
        'fchmodSync',
        'lchmodSync',
        'statSync',
        'lstatSync',
        'fstatSync',
        'linkSync',
        'symlinkSync',
        'readlinkSync',
        'realpathSync',
        'unlinkSync',
        'rmdirSync',
        'mkdirSync',
        'readdirSync',
        'closeSync',
        'openSync',
        'utimesSync',
        'futimesSync',
        'fsyncSync',
        'writeSync',
        'readSync',
        'readFileSync',
        'writeFileSync',
        'appendFileSync',
        'existsSync',
        'accessSync',

        'createReadStream',
        'createWriteStream',
        'watchFile',
        'unwatchFile',
        'watch'
    ];

    private static _async = [
        'rename',
        'ftruncate',
        'truncate',
        'chown',
        'fchown',
        'lchown',
        'chmod',
        'fchmod',
        'lchmod',
        'stat',
        'lstat',
        'fstat',
        'link',
        'symlink',
        'readlink',
        'realpath',
        'unlink',
        'rmdir',
        'mkdir',
        'readdir',
        'close',
        'open',
        'utimes',
        'futimes',
        'fsync',
        'write',
        'read',
        'readFile',
        'writeFile',
        'appendFile',
        'exists',
        'access'
    ];

    UnionFS = UnionFS;

    fss: IFS[] = [];

    funcs: any[] = [];

    props: any[] = [];

    init() {
        var self = this;
        for(var prop of UnionFS._props) this[prop] = undefined;
        for(let method of UnionFS._sync) this[method] = function() { return self._syncMethod(method, arguments); };
        for(let method of UnionFS._async) this[method] = function() { return self._asyncMethod(method, arguments); };
        return this;
    }

    // Add a file system to the union.
    use(fs: IFS) {
        var funcs = {}, props = {};
        for(var prop of UnionFS._props) {
            var property = fs[prop];
            if(typeof property !== 'undefined') this[prop] = property;
            props[prop] = property;
        }
        for(var method of UnionFS._sync) funcs[method] = fs[method];
        for(var method of UnionFS._async) funcs[method] = fs[method];

        this.fss.push(fs);
        this.props.push(props);
        this.funcs.push(funcs); // We save the functions, in case we later use `.replace()` on that `fs`.

        return this;
    }

    // Replace methods of some file system with this `unionfs` instead.
    replace(fs: IFS) {
        for(var prop of UnionFS._props) fs[prop] = this[prop];
        for(var method of UnionFS._sync) fs[method] = this[method].bind(this);
        for(var method of UnionFS._async) fs[method] = this[method].bind(this);
        return this;
    }

    private _syncMethod(method, args) {
        for(var i = this.fss.length - 1; i >= 0; i--) {
            var fs = this.fss[i];
            var funcs = this.funcs[i];
            try {
                if(!funcs[method]) throw Error('Method not supported: ' + method);
                return funcs[method].apply(fs, args);
            } catch(e) {
                if(!i) { // last one
                    throw e;
                } else {
                    // Ignore error...
                    // continue;
                }
            }
        }
    }

    private _asyncMethod(method, args) {
        args = [].slice.call(args, 0); // Convert `arguments` to `Array`.
        var lastarg = args.length - 1;
        var cb = args[lastarg];
        if(typeof cb != 'function') {
            cb = null;
            lastarg++;
        }

        var self = this;
        var iterate = function iterate(i = 0, err?) {
            // Already tried all file systems, return the last error.
            if(i >= self.fss.length) { // last one
                if(cb) cb(err ? err : Error('No file systems attached.'));
                return;
            }

            // Replace `callback` with our intermediate function.
            args[lastarg] = function(err) {
                if(err) return iterate(i + 1, err);
                if(cb) cb.apply(cb, arguments);
            };

            var j = self.fss.length - i - 1;
            var fs = self.fss[j];
            var funcs = self.funcs[j];
            if(!funcs[method]) iterate(i + 1, Error('Method not supported: ' + method));
            funcs[method].apply(fs, args);

        }
        iterate();
    }

}


var unionfs = new UnionFS;
unionfs.init();


export = unionfs;
