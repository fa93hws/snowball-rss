import * as path from 'path';
import * as fs from 'fs';

export function repoRoot() {
  let dir = __dirname;
  while (dir !== path.resolve(dir, '..')) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    dir = path.resolve(dir, '..');
  }
  throw new Error('Cannot find root dir');
}
