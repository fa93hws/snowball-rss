import type { IExitHelper } from '@services/exit-helper';
import type { IDiscordService } from '@services/discord-service';
import { EOL } from 'os';

export class ExitHelper implements IExitHelper {
  private readonly discordService: IDiscordService;
  private readonly account: number;
  private readonly discordChannelId: string;

  constructor(params: {
    discordService: IDiscordService;
    account: number;
    discordChannelId: string;
  }) {
    this.discordService = params.discordService;
    this.account = params.account;
    this.discordChannelId = params.discordChannelId;
  }

  async onUnexpectedExit(reason: string): Promise<never> {
    const message = ['服务出错(unexpected)', `QQ账号: ${this.account}`, `错误原因: ${reason}`].join(
      EOL,
    );
    await this.discordService.sendMessage(this.discordChannelId, message);
    this.discordService.logout();
    process.exit(1);
  }

  async onExpectedExit(reason: string): Promise<never> {
    const message = ['服务下线(expected)', `QQ账号: ${this.account}`, `原因: ${reason}`].join(EOL);
    await this.discordService.sendMessage(this.discordChannelId, message);
    this.discordService.logout();
    process.exit(1);
  }
}
