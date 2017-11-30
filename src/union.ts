import {IFS} from "./fs";

const isBrowser = typeof __filename === 'undefined';
const Readable = !isBrowser && require("stream").Readable;
const Writable = !isBrowser && require("stream").Writable;

const {fsAsyncMethods, fsSyncMethods} = require('fs-monkey/lib/util/lists');


export interface IUnionFsError extends Error {
    prev?: IUnionFsError,
}


export class Union {

    fss: IFS[] = [];

    public ReadStream = Readable;
    public WriteStream = Writable;
    
    constructor() {
        for(let method of fsSyncMethods) this[method] = (...args) =>  this.syncMethod(method, args);
        for(let method of fsAsyncMethods) this[method] = (...args) => this.asyncMethod(method, args);
    }

    // Add a file system to the union.
    use(fs: IFS): this {
        this.fss.push(fs);
        return this;
    }

    private syncMethod(method: string, args: any[]) {
        let lastError: IUnionFsError = null;
        for(let i = this.fss.length - 1; i >= 0; i--) {
            const fs = this.fss[i];
            try {
                if(!fs[method]) throw Error('Method not supported: ' + method);
                return fs[method].apply(fs, args);
            } catch(err) {
                err.prev = lastError;
                lastError = err;

                if(!i) { // last one
                    throw err;
                } else {
                    // Ignore error...
                    // continue;
                }
            }
        }
    }

    private asyncMethod(method: string, args: any[]) {
        let lastarg = args.length - 1;
        let cb = args[lastarg];
        if(typeof cb !== 'function') {
            cb = null;
            lastarg++;
        }

        let lastError: IUnionFsError = null;
        const iterate = (i = 0, err?: IUnionFsError) => {
            if(err) {
                err.prev = lastError;
                lastError = err;
            }

            // Already tried all file systems, return the last error.
            if(i >= this.fss.length) { // last one
                if(cb) cb(err || Error('No file systems attached.'));
                return;
            }

            // Replace `callback` with our intermediate function.
            args[lastarg] = function(err) {
                if(err) return iterate(i + 1, err);
                if(cb) cb.apply(cb, arguments);
            };

            const j = this.fss.length - i - 1;
            const fs = this.fss[j];
            const func = fs[method];

            if(!func) iterate(i + 1, Error('Method not supported: ' + method));
            else func.apply(fs, args);
        };
        iterate();
    }
}
