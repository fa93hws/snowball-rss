import * as fs from 'fs';
import { repoRoot } from '../path';

describe('repoRoot', () => {
  it('should be root dir contains package.json', () => {
    expect(fs.existsSync(`${repoRoot}/package.json`)).toBe(true);
  });
});
