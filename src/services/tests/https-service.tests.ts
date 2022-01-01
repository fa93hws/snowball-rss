import { HttpsService } from '../https-service';
import https from 'https';
import { Result } from '@utils/result';

describe('https service', () => {
  const fakeOn = jest.fn();
  const fakeGetOn = jest.fn();
  const fakeResp = { on: fakeOn };
  const fakeGetResult = { on: fakeGetOn };
  const fakeGet = jest.spyOn(https, 'get').mockImplementation((_: any, cb: any) => {
    cb(fakeResp);
    return fakeGetResult as any;
  });
  const service = new HttpsService();

  it('compose data together and resolve it', async () => {
    fakeOn.mockImplementation((name: string, cb: any) => {
      if (name === 'data') {
        cb('{"data": "ok"}');
      } else if (name === 'end') {
        cb();
      }
    });
    const resp = await service.get('abc');
    expect(resp).toEqual(
      Result.ok({
        data: 'ok',
      }),
    );
    expect(fakeGet).toHaveBeenCalledWith('abc', expect.any(Function));
  });

  it('returns error on failure', async () => {
    fakeGetOn.mockImplementation((name: string, cb: any) => {
      if (name === 'error') {
        cb('error');
      }
    });
    const resp = await service.get('abc');
    expect(resp).toEqual(Result.err('error'));
    expect(fakeGet).toHaveBeenCalledWith('abc', expect.any(Function));
  });

  afterEach(() => {
    fakeOn.mockRestore();
    fakeGetOn.mockRestore();
  });

  afterAll(() => {
    fakeGet.mockRestore();
  });
});
