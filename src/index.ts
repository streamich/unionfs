import {Union as _Union} from "./union";
import {IFS} from "./fs";


export type TFilePath = string | Buffer | URL;
export type TFileId = TFilePath | number;           // Number is used as a file descriptor.
export type TDataOut = string | Buffer;             // Data formats we give back to users.
export type TData = TDataOut | Uint8Array;          // Data formats users can give us.
export type TFlags = string | number;
export type TMode = string | number;                // Mode can be a String, although docs say it should be a Number.
export type TEncoding = 'ascii' | 'utf8' | 'utf16le' | 'ucs2' | 'base64' | 'latin1' | 'binary' | 'hex';
export type TEncodingExtended = TEncoding | 'buffer';
export type TTime = number | string | Date;


export interface IUnion {
    use(fs: IFS): this;

    readFileSync(path: TFilePath, options?: object | TEncoding);
}


export const Union = _Union;

export const ufs = (new _Union) as any as IUnion;
export default ufs;
