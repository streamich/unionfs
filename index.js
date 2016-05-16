"use strict";
var UnionFS = (function () {
    function UnionFS() {
        this.UnionFS = UnionFS;
        this.fss = [];
        this.funcs = [];
        this.props = [];
    }
    UnionFS.prototype.init = function () {
        var self = this;
        for (var _i = 0, _a = UnionFS._props; _i < _a.length; _i++) {
            var prop = _a[_i];
            this[prop] = undefined;
        }
        var _loop_1 = function(method) {
            this_1[method] = function () { return self._syncMethod(method, arguments); };
        };
        var this_1 = this;
        for (var _b = 0, _c = UnionFS._sync; _b < _c.length; _b++) {
            var method = _c[_b];
            _loop_1(method);
        }
        var _loop_2 = function(method) {
            this_2[method] = function () { return self._asyncMethod(method, arguments); };
        };
        var this_2 = this;
        for (var _d = 0, _e = UnionFS._async; _d < _e.length; _d++) {
            var method = _e[_d];
            _loop_2(method);
        }
        return this;
    };
    // Add a file system to the union.
    UnionFS.prototype.use = function (fs) {
        var funcs = {}, props = {};
        for (var _i = 0, _a = UnionFS._props; _i < _a.length; _i++) {
            var prop = _a[_i];
            var property = fs[prop];
            if (typeof property !== 'undefined')
                this[prop] = property;
            props[prop] = property;
        }
        for (var _b = 0, _c = UnionFS._sync; _b < _c.length; _b++) {
            var method = _c[_b];
            funcs[method] = fs[method];
        }
        for (var _d = 0, _e = UnionFS._async; _d < _e.length; _d++) {
            var method = _e[_d];
            funcs[method] = fs[method];
        }
        this.fss.push(fs);
        this.props.push(props);
        this.funcs.push(funcs); // We save the functions, in case we later use `.replace()` on that `fs`.
        return this;
    };
    // Replace methods of some file system with this `unionfs` instead.
    UnionFS.prototype.replace = function (fs) {
        for (var _i = 0, _a = UnionFS._props; _i < _a.length; _i++) {
            var prop = _a[_i];
            fs[prop] = this[prop];
        }
        for (var _b = 0, _c = UnionFS._sync; _b < _c.length; _b++) {
            var method = _c[_b];
            fs[method] = this[method].bind(this);
        }
        for (var _d = 0, _e = UnionFS._async; _d < _e.length; _d++) {
            var method = _e[_d];
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
        var self = this;
        var iterate = function iterate(i, err) {
            if (i === void 0) { i = 0; }
            // Already tried all file systems, return the last error.
            if (i >= self.fss.length) {
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
            var j = self.fss.length - i - 1;
            var fs = self.fss[j];
            var funcs = self.funcs[j];
            if (!funcs[method])
                iterate(i + 1, Error('Method not supported: ' + method));
            funcs[method].apply(fs, args);
        };
        iterate();
    };
    UnionFS._props = [
        'FSWatcher',
        'ReadStream',
        'WriteStream',
        'Stats',
    ];
    UnionFS._sync = [
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
    UnionFS._async = [
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
}());
var unionfs = new UnionFS;
unionfs.init();
module.exports = unionfs;
//# sourceMappingURL=index.js.map