import { FSWatcher, Dirent } from 'fs';
import { IFS } from './fs';
import { Readable, Writable } from 'stream';
import {
  fsSyncMethodsWriteonly,
  fsSyncMethodsReadonly,
  fsAsyncMethodsWriteonly,
  fsAsyncMethodsReadonly,
  fsPromiseMethodsWriteonly,
  fsPromiseMethodsReadonly,
} from './lists';

export interface IUnionFsError extends Error {
  prev?: IUnionFsError | null;
}

type readdirEntry = string | Buffer | Dirent;

const SPECIAL_METHODS = new Set([
  'existsSync',
  'readdir',
  'readdirSync',
  'createReadStream',
  'createWriteStream',
  'watch',
  'watchFile',
  'unwatchFile',
]);

const createFSProxy = (watchers: FSWatcher[]) =>
  new Proxy(
    {},
    {
      get(_obj, property) {
        const funcCallers: Array<[FSWatcher, Function]> = [];
        let prop: Function | undefined;
        for (const watcher of watchers) {
          prop = watcher[property];
          // if we're a function we wrap it in a bigger caller;
          if (typeof prop === 'function') {
            funcCallers.push([watcher, prop]);
          }
        }

        if (funcCallers.length) {
          return (...args) => {
            for (const [watcher, func] of funcCallers) {
              func.apply(watcher, args);
            }
          };
        } else {
          return prop;
        }
      },
    },
  );

export type VolOptions = {
  readonly?: boolean;
  writeonly?: boolean;
};

type SyncMethodNames = typeof fsSyncMethodsReadonly[number] & typeof fsSyncMethodsWriteonly[number];
type ASyncMethodNames = typeof fsSyncMethodsReadonly[number] & typeof fsAsyncMethodsWriteonly[number];
type PromiseMethodNames = typeof fsPromiseMethodsReadonly[number] & typeof fsPromiseMethodsWriteonly[number];
type FSMethod = (args: any) => any;
type FSMethodStack = {
  sync: {
    [K in SyncMethodNames]: FSMethod | undefined;
  };
  async: {
    [K in ASyncMethodNames]: FSMethod | undefined;
  };
  promise: {
    [K in PromiseMethodNames]: FSMethod | undefined;
  };
};

/**
 * Union object represents a stack of filesystems
 */
export class Union {
  private fss: [IFS, VolOptions, FSMethodStack][] = [];

  public ReadStream: typeof Readable | (new (...args: any[]) => Readable) = Readable;
  public WriteStream: typeof Writable | (new (...args: any[]) => Writable) = Writable;

  private promises: {} = {};

  constructor() {
    for (let method of [...fsSyncMethodsReadonly, ...fsSyncMethodsWriteonly]) {
      if (!SPECIAL_METHODS.has(method)) {
        // check we don't already have a property for this method
        this[method] = (...args) => this.syncMethod(method, args);
      }
    }
    for (let method of [...fsAsyncMethodsReadonly, ...fsAsyncMethodsWriteonly]) {
      if (!SPECIAL_METHODS.has(method)) {
        // check we don't already have a property for this method
        this[method] = (...args) => this.asyncMethod(method, args);
      }
    }

    for (let method of [...fsPromiseMethodsReadonly, ...fsPromiseMethodsWriteonly]) {
      if (method === 'readdir') {
        this.promises[method] = this.readdirPromise;

        continue;
      }

      this.promises[method] = (...args) => this.promiseMethod(method, args);
    }

    for (let method of SPECIAL_METHODS.values()) {
      // bind special methods to support
      // const { method } = ufs;
      this[method] = this[method].bind(this);
    }
  }

  public unwatchFile = (...args) => {
    throw new Error('unwatchFile is not supported, please use watchFile');
  };

  public watch = (...args) => {
    const watchers: FSWatcher[] = [];
    for (const [fs, { writeonly }] of this.fss) {
      if (writeonly) continue;
      try {
        const watcher = fs.watch.apply(fs, args);
        watchers.push(watcher);
      } catch (e) {
        // dunno what to do here...
      }
    }

    // return a proxy to call functions on these props
    return createFSProxy(watchers);
  };

  public watchFile = (...args) => {
    for (const [fs, { writeonly }] of this.fss) {
      if (writeonly) continue;
      try {
        fs.watchFile.apply(fs, args);
      } catch (e) {
        // dunno what to do here...
      }
    }
  };

  public existsSync = (path: string) => {
    for (const [fs, { writeonly }] of this.fss) {
      if (writeonly) continue;
      try {
        if (fs.existsSync(path)) {
          return true;
        }
      } catch (e) {
        // ignore
      }
    }

    return false;
  };

  public readdir = (...args): void => {
    let lastarg = args.length - 1;
    let cb = args[lastarg];
    if (typeof cb !== 'function') {
      cb = null;
      lastarg++;
    }

    let lastError: IUnionFsError | null = null;
    let result = new Map<string, readdirEntry>();
    const iterate = (i = 0, error?: IUnionFsError | null) => {
      if (error) {
        error.prev = lastError;
        lastError = error;
      }

      // Already tried all file systems, return the last error.
      if (i >= this.fss.length) {
        // last one
        if (cb) {
          cb(error || Error('No file systems attached.'));
        }
        return;
      }

      // Replace `callback` with our intermediate function.
      args[lastarg] = (err, resArg: readdirEntry[]) => {
        if (result.size === 0 && err) {
          return iterate(i + 1, err);
        }
        if (resArg) {
          for (const res of resArg) {
            result.set(this.pathFromReaddirEntry(res), res);
          }
        }

        if (i === this.fss.length - 1) {
          return cb(null, this.sortedArrayFromReaddirResult(result));
        } else {
          return iterate(i + 1, error);
        }
      };

      const j = this.fss.length - i - 1;
      const [fs, { writeonly }] = this.fss[j];
      const func = fs.readdir;

      if (!func) iterate(i + 1, Error('Method not supported: readdir'));
      else if (writeonly) iterate(i + 1, Error(`Writeonly enabled for vol '${i}': readdir`));
      else func.apply(fs, args);
    };
    iterate();
  };

  public readdirSync = (...args): Array<readdirEntry> => {
    let lastError: IUnionFsError | null = null;
    let result = new Map<string, readdirEntry>();
    for (let i = this.fss.length - 1; i >= 0; i--) {
      const [fs, { writeonly }] = this.fss[i];
      if (writeonly) continue;
      try {
        if (!fs.readdirSync) throw Error(`Method not supported: "readdirSync" with args "${args}"`);
        for (const res of fs.readdirSync.apply(fs, args)) {
          result.set(this.pathFromReaddirEntry(res), res);
        }
      } catch (err) {
        err.prev = lastError;
        lastError = err;
        if (result.size === 0 && !i) {
          // last one
          throw err;
        } else {
          // Ignore error...
          // continue;
        }
      }
    }
    return this.sortedArrayFromReaddirResult(result);
  };

  public readdirPromise = async (...args): Promise<Array<readdirEntry>> => {
    let lastError: IUnionFsError | null = null;
    let result = new Map<string, readdirEntry>();
    for (let i = this.fss.length - 1; i >= 0; i--) {
      const [fs, { writeonly }] = this.fss[i];
      if (writeonly) continue;
      try {
        if (!fs.promises || !fs.promises.readdir)
          throw Error(`Method not supported: "readdirSync" with args "${args}"`);
        for (const res of await fs.promises.readdir.apply(fs, args)) {
          result.set(this.pathFromReaddirEntry(res), res);
        }
      } catch (err) {
        err.prev = lastError;
        lastError = err;
        if (result.size === 0 && !i) {
          // last one
          throw err;
        } else {
          // Ignore error...
          // continue;
        }
      }
    }
    return this.sortedArrayFromReaddirResult(result);
  };

  private pathFromReaddirEntry = (readdirEntry: readdirEntry): string => {
    if (readdirEntry instanceof Buffer || typeof readdirEntry === 'string') {
      return String(readdirEntry);
    }
    return readdirEntry.name;
  };

  private sortedArrayFromReaddirResult = (readdirResult: Map<string, readdirEntry>): readdirEntry[] => {
    const array: readdirEntry[] = [];
    for (const key of Array.from(readdirResult.keys()).sort()) {
      const value = readdirResult.get(key);
      if (value !== undefined) array.push(value);
    }
    return array;
  };

  public createReadStream = (path: string) => {
    let lastError = null;
    for (const [fs, { writeonly }] of this.fss) {
      if (writeonly) continue;
      try {
        if (!fs.createReadStream) throw Error(`Method not supported: "createReadStream"`);

        if (fs.existsSync && !fs.existsSync(path)) {
          throw new Error(`file "${path}" does not exists`);
        }

        const stream = fs.createReadStream(path);
        if (!stream) {
          throw new Error('no valid stream');
        }
        this.ReadStream = fs.ReadStream;

        return stream;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError;
  };

  public createWriteStream = (path: string) => {
    let lastError = null;
    for (const [fs, { readonly }] of this.fss) {
      if (readonly) continue;
      try {
        if (!fs.createWriteStream) throw Error(`Method not supported: "createWriteStream"`);

        fs.statSync(path); //we simply stat first to exit early for mocked fs'es
        //TODO which filesystem to write to?
        const stream = fs.createWriteStream(path);
        if (!stream) {
          throw new Error('no valid stream');
        }
        this.WriteStream = fs.WriteStream;

        return stream;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError;
  };

  /**
   * Adds a filesystem to the list of filesystems in the union
   * The new filesystem object is added as the last filesystem used
   * when searching for a file.
   *
   * @param fs the filesystem interface to be added to the queue of FS's
   * @returns this instance of a unionFS
   */
  use(fs: IFS, options: VolOptions = {}): this {
    this.fss.push([fs, options, this.createMethods(fs, options)]);
    return this;
  }

  /**
   * At the time of the [[use]] call, we create our sync, async and promise methods
   * for performance reasons
   *
   * @param fs
   * @param options
   */
  private createMethods(fs: IFS, options: VolOptions): FSMethodStack {
    const noop = undefined;
    const createFunc = (method: string) => {
      if (!fs[method])
        return (...args: any[]) => {
          throw new Error(`Method not supported: "${method}" with args "${args}"`);
        };
      return (...args: any[]) => fs[method as string].apply(fs, args);
    };
    switch (true) {
      case options.readonly:
        return {
          sync: {
            ...fsSyncMethodsReadonly.reduce((acc, method) => {
              acc[method] = createFunc(method);
              return acc;
            }, {}),
            ...fsSyncMethodsWriteonly.reduce((acc, method) => {
              acc[method] = noop;
              return acc;
            }, {}),
          },
          async: {
            ...fsAsyncMethodsReadonly.reduce((acc, method) => {
              acc[method] = createFunc(method);
              return acc;
            }, {}),
            ...fsAsyncMethodsWriteonly.reduce((acc, method) => {
              acc[method] = noop;
              return acc;
            }, {}),
          },
          promise: {
            ...fsPromiseMethodsReadonly.reduce((acc, method) => {
              const promises = fs.promises;
              if (!promises || !promises[method]) {
                acc[method] = (...args: any) => {
                  throw Error(`Promise of method not supported: "${String(method)}" with args "${args}"`);
                };
                return acc;
              }
              acc[method] = (...args: any) => promises[method as string].apply(fs, args);
              return acc;
            }, {}),
            ...fsPromiseMethodsWriteonly.reduce((acc, method) => {
              acc[method] = noop;
              return acc;
            }, {}),
          },
        };
      case options.writeonly:
        return {
          sync: {
            ...fsSyncMethodsReadonly.reduce((acc, method) => {
              acc[method] = noop;
              return acc;
            }, {}),
            ...fsSyncMethodsWriteonly.reduce((acc, method) => {
              acc[method] = createFunc(method);
              return acc;
            }, {}),
          },
          async: {
            ...fsAsyncMethodsReadonly.reduce((acc, method) => {
              acc[method] = noop;
              return acc;
            }, {}),
            ...fsAsyncMethodsWriteonly.reduce((acc, method) => {
              acc[method] = createFunc(method);
              return acc;
            }, {}),
          },
          promise: {
            ...fsPromiseMethodsReadonly.reduce((acc, method) => {
              acc[method] = noop;
              return acc;
            }, {}),
            ...fsPromiseMethodsWriteonly.reduce((acc, method) => {
              const promises = fs.promises;
              if (!promises || !promises[method]) {
                acc[method] = (...args: any) => {
                  throw Error(`Promise of method not supported: "${String(method)}" with args "${args}"`);
                };
                return acc;
              }
              acc[method] = (...args: any) => promises[method as string].apply(fs, args);
              return acc;
            }, {}),
          },
        };
      default:
        return {
          sync: {
            ...fsSyncMethodsReadonly.reduce((acc, method) => {
              acc[method] = createFunc(method);
              return acc;
            }, {}),
            ...fsSyncMethodsWriteonly.reduce((acc, method) => {
              acc[method] = createFunc(method);
              return acc;
            }, {}),
          },
          async: {
            ...fsAsyncMethodsReadonly.reduce((acc, method) => {
              acc[method] = createFunc(method);
              return acc;
            }, {}),
            ...fsAsyncMethodsWriteonly.reduce((acc, method) => {
              acc[method] = createFunc(method);
              return acc;
            }, {}),
          },
          promise: {
            ...fsPromiseMethodsReadonly.reduce((acc, method) => {
              const promises = fs.promises;
              if (!promises || !promises[method]) {
                acc[method] = (...args: any) => {
                  throw Error(`Promise of method not supported: "${String(method)}" with args "${args}"`);
                };
                return acc;
              }
              acc[method] = (...args: any) => promises[method as string].apply(fs, args);
              return acc;
            }, {}),
            ...fsPromiseMethodsWriteonly.reduce((acc, method) => {
              const promises = fs.promises;
              if (!promises || !promises[method]) {
                acc[method] = (...args: any) => {
                  throw Error(`Promise of method not supported: "${String(method)}" with args "${args}"`);
                };
                return acc;
              }
              acc[method] = (...args: any) => promises[method as string].apply(fs, args);
              return acc;
            }, {}),
          },
        };
    }
  }

  private syncMethod(method: string, args: any[]) {
    if (!this.fss.length) throw new Error('No file systems attached');
    let lastError: IUnionFsError | null = null;
    for (let i = this.fss.length - 1; i >= 0; i--) {
      const [_fs, _options, methodStack] = this.fss[i];
      try {
        if (!methodStack['sync'][method]) continue;
        return methodStack['sync'][method](...args);
      } catch (err) {
        err.prev = lastError;
        lastError = err;
        if (!i) {
          // last one
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
    if (typeof cb !== 'function') {
      cb = null;
      lastarg++;
    }

    let lastError: IUnionFsError | null = null;
    const iterate = (i = 0, err?: IUnionFsError) => {
      if (err) {
        err.prev = lastError;
        lastError = err;
      }

      // Already tried all file systems, return the last error.
      if (i >= this.fss.length) {
        // last one
        if (cb) cb(err ?? (!this.fss.length ? new Error('No file systems attached.') : undefined));
        return;
      }

      // Replace `callback` with our intermediate function.
      args[lastarg] = function(err) {
        if (err) return iterate(i + 1, err);
        if (cb) cb.apply(cb, arguments);
      };

      const j = this.fss.length - i - 1;
      const [_fs, _options, fsMethodStack] = this.fss[j];
      const func = fsMethodStack['async'][method];

      if (!func) iterate(i + 1);
      else func(...args);
    };
    iterate();
  }

  async promiseMethod(method: string, args: any[]) {
    if (!this.fss.length) throw new Error('No file systems attached');
    let lastError = null;

    for (let i = this.fss.length - 1; i >= 0; i--) {
      const [_fs, _options, fsMethodStack] = this.fss[i];
      try {
        const func = fsMethodStack['promise'][method];
        return await func(...args);
      } catch (err) {
        err.prev = lastError;
        lastError = err;
        if (!i) {
          // last one
          throw err;
        } else {
          // Ignore error...
          // continue;
        }
      }
    }
  }
}
