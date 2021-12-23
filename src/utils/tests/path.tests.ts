import * as fs from 'fs';
import { getRepoRoot } from '../path';

describe('repoRoot', () => {
  it('should be root dir contains package.json', () => {
    expect(fs.existsSync(`${getRepoRoot()}/package.json`)).toBe(true);
  });
});
