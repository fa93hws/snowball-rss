import { Result } from '@utils/result';
import type { IRssHubService } from '@services/rss/rsshub-service';
import type { ILogger } from '@services/logging-service';
import { Message } from './message';

export type FetchError = {
  kind: 'parse' | 'network';
  error: Error;
};

export interface ISnowballRssService {
  fetch(uid: string): Promise<Result.T<Message, FetchError>>;
}

export class SnowballRssService implements ISnowballRssService {
  constructor(private readonly rssHubService: IRssHubService, private readonly logger: ILogger) {}

  fetch(uid: string): Promise<Result.T<Message, FetchError>> {
    const url = `https://rsshub.app/xueqiu/user/${uid}`;
    this.logger.verbose(`start fetching from ${url}`);
    return new Promise((resolve) => {
      this.rssHubService
        .request(url)
        .then((rawMessage) => {
          const messageResult = Message.fromRaw(rawMessage);
          if (!messageResult.isOk) {
            this.logger.error('parsing error: ', messageResult.error);
            return resolve(
              Result.err({
                kind: 'parse',
                error: messageResult.error,
              }),
            );
          }
          return resolve(Result.ok(messageResult.value));
        })
        .catch((err) => {
          this.logger.error('fetch failed', err);
          resolve(
            Result.err({
              error: err,
              kind: 'network',
            }),
          );
        });
    });
  }
}
