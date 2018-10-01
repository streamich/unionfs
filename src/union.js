"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var stream_1 = require("stream");
var _a = require('fs-monkey/lib/util/lists'), fsAsyncMethods = _a.fsAsyncMethods, fsSyncMethods = _a.fsSyncMethods;
var Union = /** @class */ (function () {
    function Union() {
        var _this = this;
        this.fss = [];
        this.ReadStream = stream_1.Readable;
        this.WriteStream = stream_1.Writable;
        var _loop_1 = function (method) {
            this_1[method] = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return _this.syncMethod(method, args);
            };
        };
        var this_1 = this;
        for (var _i = 0, fsSyncMethods_1 = fsSyncMethods; _i < fsSyncMethods_1.length; _i++) {
            var method = fsSyncMethods_1[_i];
            _loop_1(method);
        }
        var _loop_2 = function (method) {
            this_2[method] = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return _this.asyncMethod(method, args);
            };
        };
        var this_2 = this;
        for (var _a = 0, fsAsyncMethods_1 = fsAsyncMethods; _a < fsAsyncMethods_1.length; _a++) {
            var method = fsAsyncMethods_1[_a];
            _loop_2(method);
        }
        // Special case `existsSync` - it does not throw, always succeeds.
        this['existsSync'] = function (path) {
            for (var _i = 0, _a = _this.fss; _i < _a.length; _i++) {
                var fs_1 = _a[_i];
                if (fs_1.existsSync(path))
                    return true;
            }
            return false;
        };
        // special case for readdir which should union the results
        this['readdir'] = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var lastarg = args.length - 1;
            var cb = args[lastarg];
            if (typeof cb !== 'function') {
                cb = null;
                lastarg++;
            }
            var lastError = null;
            var result = null;
            var iterate = function (i, error) {
                if (i === void 0) { i = 0; }
                if (error) {
                    error.prev = lastError;
                    lastError = error;
                }
                // Already tried all file systems, return the last error.
                if (i >= _this.fss.length) { // last one
                    if (cb) {
                        cb(error || Error('No file systems attached.'));
                    }
                    ;
                    return;
                }
                // Replace `callback` with our intermediate function.
                args[lastarg] = function (err, resArg) {
                    if (err) {
                        return iterate(i + 1, err);
                    }
                    if (resArg) {
                        result = result !== null ? result : new Set();
                        // Convert all results to Strings to make sure that they're deduped
                        for (var _i = 0, resArg_1 = resArg; _i < resArg_1.length; _i++) {
                            var res = resArg_1[_i];
                            result.add(String(res));
                        }
                    }
                    if (i === _this.fss.length - 1) {
                        return cb(null, Array.from(result).sort());
                    }
                    else {
                        return iterate(i + 1, error);
                    }
                };
                var j = _this.fss.length - i - 1;
                var fs = _this.fss[j];
                var func = fs.readdir;
                if (!func)
                    iterate(i + 1, Error('Method not supported: readdir'));
                else
                    func.apply(fs, args);
            };
            iterate();
        };
        this['readdirSync'] = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var lastError = null;
            var result = new Set();
            for (var i = _this.fss.length - 1; i >= 0; i--) {
                var fs_2 = _this.fss[i];
                try {
                    if (!fs_2.readdirSync)
                        throw Error("Method not supported: \"readdirSync\" with args \"" + args + "\"");
                    for (var _a = 0, _b = fs_2.readdirSync.apply(fs_2, args); _a < _b.length; _a++) {
                        var res = _b[_a];
                        // Convert all results to Strings to make sure that they're deduped
                        result.add(String(res));
                    }
                }
                catch (err) {
                    err.prev = lastError;
                    lastError = err;
                    if (!i) { // last one
                        throw err;
                    }
                    else {
                        // Ignore error...
                        // continue;
                    }
                }
            }
            return Array.from(result).sort();
        };
        // Special case `createReadStream`
        this['createReadStream'] = function (path) {
            var lastError = null;
            for (var _i = 0, _a = _this.fss; _i < _a.length; _i++) {
                var fs_3 = _a[_i];
                try {
                    if (!fs_3.createReadStream)
                        throw Error("Method not supported: \"createReadStream\"");
                    if (fs_3.existsSync && !fs_3.existsSync(path)) {
                        throw new Error("file \"" + path + "\" does not exists");
                    }
                    var stream = fs_3.createReadStream(path);
                    if (!stream) {
                        throw new Error("no valid stream");
                    }
                    _this.ReadStream = fs_3.ReadStream;
                    return stream;
                }
                catch (err) {
                    lastError = err;
                }
            }
            throw lastError;
        };
        // Special case `createWriteStream`
        this['createWriteStream'] = function (path) {
            var lastError = null;
            for (var _i = 0, _a = _this.fss; _i < _a.length; _i++) {
                var fs_4 = _a[_i];
                try {
                    if (!fs_4.createWriteStream)
                        throw Error("Method not supported: \"createWriteStream\"");
                    fs_4.statSync(path); //we simply stat first to exit early for mocked fs'es
                    //TODO which filesystem to write to?
                    var stream = fs_4.createWriteStream(path);
                    if (!stream) {
                        throw new Error("no valid stream");
                    }
                    _this.WriteStream = fs_4.WriteStream;
                    return stream;
                }
                catch (err) {
                    lastError = err;
                }
            }
            throw lastError;
        };
    }
    // Add a file system to the union.
    Union.prototype.use = function (fs) {
        this.fss.push(fs);
        return this;
    };
    Union.prototype.syncMethod = function (method, args) {
        var lastError = null;
        for (var i = this.fss.length - 1; i >= 0; i--) {
            var fs_5 = this.fss[i];
            try {
                if (!fs_5[method])
                    throw Error("Method not supported: \"" + method + "\" with args \"" + args + "\"");
                return fs_5[method].apply(fs_5, args);
            }
            catch (err) {
                err.prev = lastError;
                lastError = err;
                if (!i) { // last one
                    throw err;
                }
                else {
                    // Ignore error...
                    // continue;
                }
            }
        }
    };
    Union.prototype.asyncMethod = function (method, args) {
        var _this = this;
        var lastarg = args.length - 1;
        var cb = args[lastarg];
        if (typeof cb !== 'function') {
            cb = null;
            lastarg++;
        }
        var lastError = null;
        var iterate = function (i, err) {
            if (i === void 0) { i = 0; }
            if (err) {
                err.prev = lastError;
                lastError = err;
            }
            // Already tried all file systems, return the last error.
            if (i >= _this.fss.length) { // last one
                if (cb)
                    cb(err || Error('No file systems attached.'));
                return;
            }
            // Replace `callback` with our intermediate function.
            args[lastarg] = function (err) {
                if (err)
                    return iterate(i + 1, err);
                if (cb)
                    cb.apply(cb, arguments);
            };
            var j = _this.fss.length - i - 1;
            var fs = _this.fss[j];
            var func = fs[method];
            if (!func)
                iterate(i + 1, Error('Method not supported: ' + method));
            else
                func.apply(fs, args);
        };
        iterate();
    };
    return Union;
}());
exports.Union = Union;
