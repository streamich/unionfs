"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var Union = (function () {
    function Union() {
        this.fss = [];
    }
    Union.prototype.init = function () {
        var _this = this;
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
        for (var _i = 0, fsSyncMethods_1 = util_1.fsSyncMethods; _i < fsSyncMethods_1.length; _i++) {
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
        for (var _a = 0, fsAsyncMethods_1 = util_1.fsAsyncMethods; _a < fsAsyncMethods_1.length; _a++) {
            var method = fsAsyncMethods_1[_a];
            _loop_2(method);
        }
        return this;
    };
    // Add a file system to the union.
    Union.prototype.use = function (fs) {
        this.fss.push(fs);
        return this;
    };
    Union.prototype.syncMethod = function (method, args) {
        var lastError = null;
        for (var i = this.fss.length - 1; i >= 0; i--) {
            var fs = this.fss[i];
            try {
                if (!fs[method])
                    throw Error('Method not supported: ' + method);
                return fs[method].apply(fs, args);
            }
            catch (err) {
                err.prev = lastError;
                lastError = err;
                if (!i) {
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
            if (i >= _this.fss.length) {
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
            func[method].apply(fs, args);
        };
        iterate();
    };
    return Union;
}());
exports.Union = Union;
