import { Result } from '../result';

describe('Result', () => {
  describe('constructor', () => {
    it('creates an OK object', () => {
      expect(Result.ok('ok')).toEqual({
        isOk: true,
        value: 'ok',
      });
    });

    it('creates an error object', () => {
      expect(Result.err('err')).toEqual({
        isOk: false,
        error: 'err',
      });
    });
  });

  describe('unwrap', () => {
    it('extracts value for ok object', () => {
      const ok = Result.ok('ok');
      expect(Result.unwrap(ok)).toEqual('ok');
    });

    it('throws for error object', () => {
      const err = Result.err(new Error('err'));
      expect(() => Result.unwrap(err)).toThrowError('err');
    });
  });
});
