import { Result } from '@utils/result';
import https from 'https';

export interface IHttpService {
  get<T>(url: string): Promise<Result.Result<T, Error>>;
}

export class HttpsService implements IHttpService {
  get<T>(url: string): Promise<Result.Result<T, Error>> {
    return new Promise((resolve) => {
      https
        .get(url, (resp) => {
          let data = '';

          resp.on('data', (chunk) => {
            data += chunk;
          });

          resp.on('end', () => {
            resolve(Result.ok(JSON.parse(data)));
          });
        })
        .on('error', (err) => resolve(Result.err(err)));
    });
  }
}
