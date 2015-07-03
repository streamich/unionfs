var UnionFS = (function () {
    function UnionFS() {
        this.UnionFS = UnionFS;
        this.fss = [];
        this.funcs = [];
    }
    UnionFS.prototype.init = function () {
        var self = this;
        for (var i = 0; i < UnionFS.sync.length; i++) {
            (function (method) {
                self[method] = function () {
                    return self._syncMethod(method, arguments);
                };
            })(UnionFS.sync[i]);
        }
        for (var i = 0; i < UnionFS.async.length; i++) {
            (function (method) {
                self[method] = function () {
                    self._asyncMethod(method, arguments);
                };
            })(UnionFS.async[i]);
        }
        return this;
    };
    // Add a file system to the union.
    UnionFS.prototype.use = function (fs) {
        var funcs = {};
        for (var i = 0; i < UnionFS.sync.length; i++) {
            var method = UnionFS.sync[i];
            funcs[method] = fs[method];
        }
        for (var i = 0; i < UnionFS.async.length; i++) {
            var method = UnionFS.async[i];
            funcs[method] = fs[method];
        }
        this.fss.push(fs);
        this.funcs.push(funcs); // We save the functions, in case we later use `.replace()` on that `fs`.
        return this;
    };
    // Replace methods of some file system with this `unionfs` instead.
    UnionFS.prototype.replace = function (fs) {
        for (var i = 0; i < UnionFS.sync.length; i++) {
            var method = UnionFS.sync[i];
            fs[method] = this[method].bind(this);
        }
        for (var i = 0; i < UnionFS.async.length; i++) {
            var method = UnionFS.async[i];
            fs[method] = this[method].bind(this);
        }
        return this;
    };
    UnionFS.prototype._syncMethod = function (method, args) {
        for (var i = this.fss.length - 1; i >= 0; i--) {
            var fs = this.fss[i];
            var funcs = this.funcs[i];
            try {
                if (!funcs[method])
                    throw Error('Method not supported: ' + method);
                return funcs[method].apply(fs, args);
            }
            catch (e) {
                if (!i) {
                    throw e;
                }
                else {
                }
            }
        }
    };
    UnionFS.prototype._asyncMethod = function (method, args) {
        args = [].slice.call(args, 0); // Convert `arguments` to `Array`.
        var lastarg = args.length - 1;
        var cb = args[lastarg];
        if (typeof cb != 'function') {
            cb = null;
            lastarg++;
        }
        var iterate = function iterate(i, err) {
            if (i === void 0) { i = 0; }
            // Already tried all file systems, return the last error.
            if (i >= this.fss.length) {
                if (cb)
                    cb(err ? err : Error('No file systems attached.'));
                return;
            }
            // Replace `callback` with our intermediate function.
            args[lastarg] = function (err) {
                if (err)
                    return iterate(i + 1, err);
                if (cb)
                    cb.apply(cb, arguments);
            };
            var j = this.fss.length - i - 1;
            var fs = this.fss[j];
            var funcs = this.funcs[j];
            if (!funcs[method])
                iterate(i + 1, Error('Method not supported: ' + method));
            funcs[method].apply(fs, args);
        }.bind(this);
        iterate();
    };
    UnionFS.sync = [
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
    UnionFS.async = [
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
    return UnionFS;
})();
var unionfs = new UnionFS;
unionfs.init();
module.exports = unionfs;
