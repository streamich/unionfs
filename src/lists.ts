export const fsSyncMethodsWriteonly = [
  "appendFileSync",
  "chmodSync",
  "chownSync",
  "closeSync",
  "copyFileSync",
  "createWriteStream",
  "fchmodSync",
  "fchownSync",
  "fdatasyncSync",
  "fsyncSync",
  "futimesSync",
  "lchmodSync",
  "lchownSync",
  "linkSync",
  "lstatSync",
  "mkdirpSync",
  "mkdirSync",
  "mkdtempSync",
  "renameSync",
  "rmdirSync",
  "symlinkSync",
  "truncateSync",
  "unlinkSync",
  "utimesSync",
  "writeFileSync",
  "writeSync"
] as const;

export const fsSyncMethodsReadonly = [
  "accessSync",
  "createReadStream",
  "existsSync",
  "fstatSync",
  "ftruncateSync",
  "openSync",
  "readdirSync",
  "readFileSync",
  "readlinkSync",
  "readSync",
  "realpathSync",
  "statSync"
] as const;
export const fsAsyncMethodsReadonly = [
  "access",
  "exists",
  "fstat",
  "open",
  "read",
  "readdir",
  "readFile",
  "readlink",
  "realpath",
  "unwatchFile",
  "watch",
  "watchFile"
] as const;
export const fsAsyncMethodsWriteonly = [
  "appendFile",
  "chmod",
  "chown",
  "close",
  "copyFile",
  "fchmod",
  "fchown",
  "fdatasync",
  "fsync",
  "ftruncate",
  "futimes",
  "lchmod",
  "lchown",
  "link",
  "lstat",
  "mkdir",
  "mkdirp",
  "mkdtemp",
  "rename",
  "rmdir",
  "stat",
  "symlink",
  "truncate",
  "unlink",
  "utimes",
  "write",
  "writeFile"
] as const;

export const fsPromiseMethodsReadonly = [
  "access",
  "open",
  "opendir",
  "readdir",
  "readFile",
  "readlink",
  "realpath"
] as const;

export const fsPromiseMethodsWriteonly = [
  "appendFile",
  "chmod",
  "chown",
  "copyFile",
  "lchmod",
  "lchown",
  "link",
  "lstat",
  "mkdir",
  "mkdtemp",
  "rename",
  "rmdir",
  "stat",
  "symlink",
  "truncate",
  "unlink",
  "utimes",
  "writeFile",
] as const;
