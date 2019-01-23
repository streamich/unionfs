import {IFS} from "./fs";
import {Readable, Writable} from 'stream';
const {fsAsyncMethods, fsSyncMethods} = require('fs-monkey/lib/util/lists');

export interface IUnionFsError extends Error {
    prev?: IUnionFsError,
}

const SPECIAL_METHODS = new Set([
    "existsSync",
    "readdir",
    "readdirSync",
    "createReadStream",
    "createWriteStream",
    "watch",
    "watchFile"
]);

const createFSProxy = watchers => new Proxy({}, {
    get(_obj, property) {
        const funcCallers = [];
        let prop;
        for (const watcher of watchers) {
            prop = watcher[property];
            // if we're a function we wrap it in a bigger caller;
            if (typeof prop === "function") {
                funcCallers.push([ watcher, prop ]);
            }
        }

        if (funcCallers.length) {
            return (...args) => {
                for (const [ watcher, func ] of funcCallers) {
                    func.apply(watcher, args);
                }
            }
        } else {
            return prop;
        }
    }
});


/**
 * Union object represents a stack of filesystems
 */
export class Union {

    private fss: IFS[] = [];

    public ReadStream = Readable;
    public WriteStream = Writable;

    constructor() {
        for(let method of fsSyncMethods) {
            if (SPECIAL_METHODS.has(method)) { // check we don't already have a property for this method
                this[method] = (...args) =>  this.syncMethod(method, args);
            }
        }
        for(let method of fsAsyncMethods) {
            if (SPECIAL_METHODS.has(method)) { // check we don't already have a property for this method
                this[method] = (...args) => this.asyncMethod(method, args);
            }
        }

        for (let method of SPECIAL_METHODS.values()) {
            // bind special methods to support 
            // const { method } = ufs;
            this[method] = this[method].bind(this);
        }
    }

    public watch(...args) {
        const watchers = [];
        for (const fs of this.fss) {
            try {
                const watcher = fs.watch.apply(fs, args);
                watchers.push(watcher);
            } catch (e) {
                // dunno what to do here...
            }
        }

        // return a proxy to call functions on these props 
        return createFSProxy(watchers);
    }

    public watchFile(...args) {
        const watchers = [];
        for (const fs of this.fss) {
            try {
                const watcher = fs.watchFile.apply(fs, args);
                watchers.push(watcher);
            } catch (e) {
                // dunno what to do here...
            }
        }

        // return a proxy to call functions on these props 
        return createFSProxy(watchers);
    }

    public existsSync(path: string) {
        for (const fs of this.fss) {
            try {
                if(fs.existsSync(path)) {
                    return true
                }
            } catch (e) {
                // ignore
            }
        }

        return false;
    };

    public readdir(...args) {
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
                    return cb(null, Array.from(result).sort());
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

    public readdirSync(...args) {
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
        return Array.from(result).sort();
    };

    public createReadStream(path: string) {
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

    public createWriteStream(path: string) {
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

    /**
     * Adds a filesystem to the list of filesystems in the union
     * The new filesystem object is added as the last filesystem used 
     * when searching for a file. 
     * 
     * @param fs the filesystem interface to be added to the queue of FS's
     * @returns this instance of a unionFS
     */
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
