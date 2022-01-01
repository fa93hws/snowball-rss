import type { ILogger } from '@services/logging-service';
import type { ISlackService } from '@services/slack-service';
import type { IExitHelper } from '@services/exit-helper';
import { EOL } from 'os';

export class ExitHelper implements IExitHelper {
  private readonly logger: ILogger;
  private readonly slackService: ISlackService;

  constructor(
    services: {
      logger: ILogger;
      slackService: ISlackService;
    },
    private readonly channel: string,
  ) {
    this.logger = services.logger;
    this.slackService = services.slackService;
  }

  async onUnexpectedExit(e: any): Promise<never> {
    const plainTextMessage = ['*[fatal] service down*', '_reason_: ', '', '```', e, '```'].join(
      EOL,
    );
    const postMessageResult = await this.slackService.postSimpleMessage({
      channel: this.channel,
      abstract: '[致命的错误] 无法继续运行',
      text: plainTextMessage,
    });
    if (!postMessageResult.isOk) {
      this.logger.error(`failed to send crash message to slack due to ${postMessageResult.error}`);
    }
    process.exit(1);
  }

  async onExpectedExit(e: any): Promise<never> {
    const postMessageResult = await this.slackService.postSimpleMessage({
      channel: this.channel,
      abstract: 'Service down',
      text: `Service down, due to ${e}`,
    });
    if (!postMessageResult.isOk) {
      this.logger.error(`failed to send crash message to slack due to ${postMessageResult.error}`);
    }
    process.exit(1);
  }
}
