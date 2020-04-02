import { Union as _Union } from './union';
import { IFS } from './fs';

export interface IUnionFs extends IFS {
  use: (...args: Parameters<_Union['use']>) => this;
}

export const Union = (_Union as any) as new () => IUnionFs;

export const ufs = (new _Union() as any) as IUnionFs;
export default ufs;
