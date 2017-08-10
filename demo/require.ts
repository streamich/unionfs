import {Union} from '../src/union';
import {Volume} from '../../memfs/src/volume';
import * as fs from 'fs';
import {IFS} from "../src/fs";

const vol = Volume.fromJSON({[__dirname + '/fake.js']: 'console.log("owned");'});
// console.log(vol.readFileSync(__dirname + '/fake.js', 'utf8'));

const ufs = new Union as any;

ufs
    .use(vol)
    .use(fs);

const bfs = (process as any).binding('fs');
bfs.internalModuleReadFile = ufs.readFileSync.bind(ufs);
bfs.internalModuleStat = ufs.statSync.bind(ufs);
(fs as any).realpathSync = ufs.realpathSync.bind(ufs);
(fs as any).readFileSync = ufs.readFileSync.bind(ufs);
// require(__dirname + '/fake.js');
// console.log(ufs.realpathSync(__dirname + '/fake.js', 'utf8'));

const internalModuleReadFile = (path) => {
    try {
        return ufs.readFileSync(path, 'utf8');
    } catch(err) {

    }
};
// const internalModuleReadFile = (path) => '123';

const internalModuleStat = filename => {
    try {
        return ufs.statSync(filename).isDirectory() ? 1 : 0;
    } catch(err) {
        return -1;
    }
};

function stat(filename) {
    filename = path._makeLong(filename);
    const cache = (stat as any).cache;
    if (cache !== null) {
        const result = cache.get(filename);
        if (result !== undefined) return result;
    }
    const result = internalModuleStat(filename);
    if (cache !== null) cache.set(filename, result);
    return result;
}
(stat as any).cache = null;



const preserveSymlinks = false;



function toRealPath(requestPath) {
    return ufs.realpathSync(requestPath, {});
}



const packageMainCache = Object.create(null);


function readPackage(requestPath) {
    // console.log('requestPath', requestPath);
    const entry = packageMainCache[requestPath];
    if (entry)
        return entry;

    const jsonPath = path.resolve(requestPath, 'package.json');
    const json = internalModuleReadFile(path._makeLong(jsonPath));

    if (json === undefined) {
        return false;
    }

    try {
        var pkg = packageMainCache[requestPath] = JSON.parse(json).main;
    } catch (e) {
        e.path = jsonPath;
        e.message = 'Error parsing ' + jsonPath + ': ' + e.message;
        throw e;
    }
    return pkg;
}


function tryFile(requestPath, isMain) {
    console.log('requestPath', requestPath);
    const rc = stat(requestPath);
    if (preserveSymlinks && !isMain) {
        return rc === 0 && path.resolve(requestPath);
    }
    return rc === 0 && toRealPath(requestPath);
}

// given a path check a the file exists with any of the set extensions
function tryExtensions(p, exts, isMain) {
    for (var i = 0; i < exts.length; i++) {
        const filename = tryFile(p + exts[i], isMain);

        if (filename) {
            return filename;
        }
    }
    return false;
}


function tryPackage(requestPath, exts, isMain) {
    var pkg = readPackage(requestPath);

    if (!pkg) return false;

    var filename = path.resolve(requestPath, pkg);
    return tryFile(filename, isMain) ||
        tryExtensions(filename, exts, isMain) ||
        tryExtensions(path.resolve(filename, 'index'), exts, isMain);
}


var warned = false;


const path = require('path');
const Module = require('module');
Module._findPath = function(request, paths, isMain) {
    if (path.isAbsolute(request)) {
        paths = [''];
    } else if (!paths || paths.length === 0) {
        return false;
    }

    var cacheKey = request + '\x00' +
        (paths.length === 1 ? paths[0] : paths.join('\x00'));
    var entry = Module._pathCache[cacheKey];
    if (entry)
        return entry;

    var exts;
    var trailingSlash = request.length > 0 &&
        request.charCodeAt(request.length - 1) === 47/*/*/;

    // For each path
    for (var i = 0; i < paths.length; i++) {
        // Don't search further if path doesn't exist
        const curPath = paths[i];
        if (curPath && stat(curPath) < 1) continue;
        var basePath = path.resolve(curPath, request);
        var filename;

        var rc = stat(basePath);
        if (!trailingSlash) {
            if (rc === 0) {  // File.
                if (preserveSymlinks && !isMain) {
                    filename = path.resolve(basePath);
                } else {
                    filename = toRealPath(basePath);
                }
            } else if (rc === 1) {  // Directory.
                if (exts === undefined)
                    exts = Object.keys(Module._extensions);
                filename = tryPackage(basePath, exts, isMain);
            }

            if (!filename) {
                // try it with each of the extensions
                if (exts === undefined)
                    exts = Object.keys(Module._extensions);
                filename = tryExtensions(basePath, exts, isMain);
            }
        }

        if (!filename && rc === 1) {  // Directory.
            if (exts === undefined)
                exts = Object.keys(Module._extensions);
            filename = tryPackage(basePath, exts, isMain);
        }

        if (!filename && rc === 1) {  // Directory.
            // try it with each of the extensions at "index"
            if (exts === undefined)
                exts = Object.keys(Module._extensions);
            filename = tryExtensions(path.resolve(basePath, 'index'), exts, isMain);
        }

        if (filename) {
            // Warn once if '.' resolved outside the module dir
            if (request === '.' && i > 0) {
                if (!warned) {
                    warned = true;
                    process.emitWarning(
                        'warning: require(\'.\') resolved outside the package ' +
                        'directory. This functionality is deprecated and will be removed ' +
                        'soon.',
                        'DeprecationWarning', 'DEP0019' as any);
                }
            }

            Module._pathCache[cacheKey] = filename;
            return filename;
        }
    }
    return false;
};

require(__dirname + '/fake.js');

