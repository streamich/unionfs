import { Union as _Union, VolOptions } from './union';
import { IFS } from './fs';

export interface IUnionFs extends IFS {
  use: (fs: IFS, options?: VolOptions) => this;
}

export const Union = (_Union as any) as new () => IUnionFs;

export const ufs = (new _Union() as any) as IUnionFs;
export default ufs;
