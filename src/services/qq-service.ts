import { Result } from '@utils/result';
import { createClient, segment } from 'oicq';
import type { Client } from 'oicq';
import type { ILogger } from './logging-service';

export class QQService {
  private loggedIn = false;
  private readonly client: Client;
  private readonly logger: ILogger;

  constructor(params: { account: number; logger: ILogger }) {
    this.client = createClient(params.account);
    this.logger = params.logger;
  }

  private waitOnline(): Promise<void> {
    return new Promise((resolve) => {
      this.client.on('system.online', () => {
        this.loggedIn = true;
        resolve();
      });
    });
  }

  async login(password?: string): Promise<Result.Result<1, unknown>> {
    try {
      if (password != null) {
        await this.client.login(password);
        await this.waitOnline();
        return Result.ok(1);
      }
      await this.client
        .on('system.login.qrcode', function (this: Client) {
          //扫码后按回车登录
          process.stdin.once('data', () => {
            this.login();
          });
        })
        .login();
      await this.waitOnline();
      return Result.ok(1);
    } catch (e) {
      this.logger.error(e);
      return Result.err(e);
    }
  }

  async sendMessageToUser(userId: number, message: string): Promise<Result.Result<1, unknown>> {
    if (!this.loggedIn) {
      return Result.err('not logged in');
    } else if (!this.client.fl.has(userId)) {
      return Result.err('no friend with id ' + userId);
    }
    const user = this.client.pickFriend(userId, true);
    try {
      await user.sendMsg(message);
      return Result.ok(1);
    } catch (e) {
      this.logger.error(e);
      return Result.err(e);
    }
  }

  async sendMessageToGroup(
    groupId: number,
    message: string,
    image?: Buffer,
  ): Promise<Result.Result<1, unknown>> {
    if (!this.loggedIn) {
      return Result.err('not logged in');
    } else if (!this.client.gl.has(groupId)) {
      return Result.err('no group with id ' + groupId);
    }
    const group = this.client.pickGroup(groupId, true);
    try {
      this.logger.debug('posting message in group');
      await group.sendMsg(message);
      this.logger.debug('message sent, does it has image? ' + (image != null));
      if (image != null) {
        await group.sendMsg(segment.image(image));
        this.logger.debug('image sent');
      }
      return Result.ok(1);
    } catch (e) {
      this.logger.error(e);
      return Result.err(e);
    }
  }
}
