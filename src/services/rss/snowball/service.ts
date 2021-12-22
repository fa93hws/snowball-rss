import { Result } from '@utils/result';
import { IRssHubService } from '@services/rss/rsshub-service';
import { EOL } from 'os';
import { Message } from './message';

type FetchError = {
  kind: 'parse' | 'network';
  message: string;
};

export interface ISnowballRssService {
  fetch(url: string): Promise<Result.Result<Message, FetchError>>;
}

export class SnowballRssService implements ISnowballRssService {
  constructor(private rssHubService: IRssHubService) {}

  fetch(url: string): Promise<Result.Result<Message, FetchError>> {
    return new Promise((resolve) => {
      this.rssHubService
        .request(url)
        .then((rawMessage) => {
          const messageResult = Message.fromRaw(rawMessage);
          if (!messageResult.isOk) {
            process.stderr.write(messageResult.error + EOL);
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
