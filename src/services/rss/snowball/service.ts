import { Result } from '@utils/result';
import type { IRssHubService } from '@services/rss/rsshub-service';
import type { ILogger } from '@services/logging-service';
import { Message } from './message';

export type FetchError = {
  kind: 'parse' | 'network';
  message: string;
};

export interface ISnowballRssService {
  fetch(uid: string): Promise<Result.Result<Message, FetchError>>;
}

export class SnowballRssService implements ISnowballRssService {
  constructor(private readonly rssHubService: IRssHubService, private readonly logger: ILogger) {}

  fetch(uid: string): Promise<Result.Result<Message, FetchError>> {
    const url = `https://rsshub.app/xueqiu/user/${uid}`;
    this.logger.verbose('start fetching from ' + url);
    return new Promise((resolve) => {
      this.rssHubService
        .request(url)
        .then((rawMessage) => {
          const messageResult = Message.fromRaw(rawMessage);
          if (!messageResult.isOk) {
            this.logger.error('parsing error: ' + messageResult.error);
            return resolve(
              Result.err({
                kind: 'parse',
                message: messageResult.error,
              }),
            );
          }
          return resolve(Result.ok(messageResult.value));
        })
        .catch((err) => {
          this.logger.error('fetch failed, error is');
          this.logger.error(err);
          resolve(
            Result.err({
              message: err.toString(),
              kind: 'network',
            }),
          );
        });
    });
  }
}
