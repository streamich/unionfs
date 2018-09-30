import {IFS} from "./fs";
import {Readable, Writable} from 'stream';
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

        // Special case `existsSync` - it does not throw, always succeeds.
        this['existsSync'] = path => {
            for (const fs of this.fss)
                if(fs.existsSync(path))
                    return true;
            return false;
        };

        // special case for readdir which should union the results
        this['readdir'] = (...args) => {
            let lastarg = args.length - 1;
            let cb = args[lastarg];
            if(typeof cb !== 'function') {
                cb = null;
                lastarg++;
            }

            let lastError: IUnionFsError = null;
            let result: Set<string> | null = null;
            const iterate = (i = 0, error?: IUnionFsError) => {
                if(error) {
                    error.prev = lastError;
                    lastError = error;
                }

                // Already tried all file systems, return the last error.
                if(i >= this.fss.length) { // last one
                    if(cb) {
                        cb(error || Error('No file systems attached.'));
                    };
                    return;
                }

                // Replace `callback` with our intermediate function.
                args[lastarg] = (err, resArg: string[] | Buffer[]) => {
                    if(err) {
                        return iterate(i + 1, err);
                    }
                    if(resArg) {
                        result = result !== null ? result : new Set();
                        
                        // Convert all results to Strings to make sure that they're deduped
                        for (const res of resArg) {
                            result.add(String(res));
                        }
                    }

                    if (i === this.fss.length - 1) {
                        return cb(null, Array.from(result));
                    } else {
                        return iterate(i + 1, error);
                    }
                };

                const j = this.fss.length - i - 1;
                const fs = this.fss[j];
                const func = fs.readdir;

                if(!func) iterate(i + 1, Error('Method not supported: readdir'));
                else func.apply(fs, args);
            };
            iterate();
        };
        this['readdirSync'] = (...args) => {
            let lastError: IUnionFsError = null;
            let result = new Set<string>();
            for(let i = this.fss.length - 1; i >= 0; i--) {
                const fs = this.fss[i];
                try {
                    if(!fs.readdirSync) throw Error(`Method not supported: "readdirSync" with args "${args}"`);
                    for (const res of fs.readdirSync.apply(fs, args)) {
                        // Convert all results to Strings to make sure that they're deduped
                        result.add(String(res));
                    }
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
            return Array.from(result);
        };

        // Special case `createReadStream`
        this['createReadStream'] = path => {
            let lastError = null;
            for (const fs of this.fss) {
                try {
                    if(!fs.createReadStream) throw Error(`Method not supported: "createReadStream"`);

                    if (fs.existsSync && !fs.existsSync(path)) {
                        throw new Error(`file "${path}" does not exists`);
                    }

                    const stream = fs.createReadStream(path);
                    if (!stream) {
                        throw new Error("no valid stream")
                    }
                    this.ReadStream = fs.ReadStream;

                    return stream;
                }
                catch (err) {
                    lastError = err;
                }
            }

            throw lastError;
        }

        // Special case `createWriteStream`
        this['createWriteStream'] = path => {
            let lastError = null;
            for (const fs of this.fss) {
                try {
                    if(!fs.createWriteStream) throw Error(`Method not supported: "createWriteStream"`);

                    fs.statSync(path); //we simply stat first to exit early for mocked fs'es
                    //TODO which filesystem to write to?
                    const stream = fs.createWriteStream(path);
                    if (!stream) {
                        throw new Error("no valid stream")
                    }
                    this.WriteStream = fs.WriteStream;

                    return stream;
                }
                catch (err) {
                    lastError = err;
                }
            }

            throw lastError;
        }

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
                if(!fs[method]) throw Error(`Method not supported: "${method}" with args "${args}"`);
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
