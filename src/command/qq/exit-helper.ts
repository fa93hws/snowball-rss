import type { IExitHelper } from '@services/exit-helper';
import type { ILogger } from '@services/logging-service';
import type { IQQService } from '@services/qq-service';
import { EOL } from 'os';

export class ExitHelper implements IExitHelper {
  constructor(
    private readonly qqService: IQQService,
    private readonly logger: ILogger,
    private readonly adminId: number,
  ) {}

  async onUnexpectedExit(e: any): Promise<never> {
    const result = await this.qqService.sendMessageToUser(
      this.adminId,
      '群聊机器人出错了' + EOL + e,
    );
    if (result.isOk) {
      this.logger.info('app crashed, message sent to ' + this.adminId);
    } else {
      this.logger.error('app crashed, message can not be sent to ' + this.adminId);
      this.logger.error('app crashed, due to ' + e);
    }
    process.exit(1);
  }

  async onExpectedExit(e: any): Promise<never> {
    const result = await this.qqService.sendMessageToUser(
      this.adminId,
      'Service Down due to' + EOL + e,
    );
    if (result.isOk) {
      this.logger.info('app stop in an expected way, message sent to ' + this.adminId);
    } else {
      this.logger.error('app stop in an expected way, message can not be sent to ' + this.adminId);
      this.logger.error('app stop in an expected way, due to ' + e);
    }
    process.exit(1);
  }
}
