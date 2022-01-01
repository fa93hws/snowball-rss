import type { IExitHelper } from '@services/exit-helper';
import type { IHttpService } from '@services/https-service';
import type { ILogger } from '@services/logging-service';
import type { Result } from '@utils/result';

export class ExitHelper implements IExitHelper {
  private readonly qmsgUrlPrefix;
  private readonly httpService: IHttpService;
  private readonly account: number;
  private readonly logger: ILogger;

  constructor(params: {
    httpService: IHttpService;
    account: number;
    logger: ILogger;
    qmsgToken: string;
  }) {
    this.qmsgUrlPrefix = `https://qmsg.zendee.cn/send/${params.qmsgToken}`;
    this.httpService = params.httpService;
    this.logger = params.logger;
    this.account = params.account;
  }

  private maybeLogError(result: Result.Result<unknown, Error>) {
    if (!result.isOk) {
      this.logger.error('failed to send message to QMSG, error is');
      this.logger.error(result.error);
    }
  }

  async onUnexpectedExit(): Promise<never> {
    const msg = `非正常服务下线${Array.from(this.account.toString()).join('-')}`;
    const result = await this.httpService.get(
      `${this.qmsgUrlPrefix}?msg=${encodeURIComponent(msg)}`,
    );
    this.maybeLogError(result);
    process.exit(1);
  }

  async onExpectedExit(): Promise<never> {
    const msg = `服务下线${Array.from(this.account.toString()).join('-')}`;
    const result = await this.httpService.get(
      `${this.qmsgUrlPrefix}?msg=${encodeURIComponent(msg)}`,
    );
    this.maybeLogError(result);

    process.exit(1);
  }
}
