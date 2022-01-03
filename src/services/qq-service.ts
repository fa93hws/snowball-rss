import { Result } from '@utils/result';
import { createClient, segment } from 'oicq';
import type { Client } from 'oicq';
import type { ILogger } from './logging-service';
import type { IExitHelper } from './exit-helper';

export interface IQQService {
  sendMessageToGroup(
    groupId: number,
    message: string,
    image?: Buffer,
  ): Promise<Result.Result<1, unknown>>;

  sendMessageToUser(userId: number, message: string): Promise<Result.Result<1, unknown>>;
}

export class QQService implements IQQService {
  private loggedIn = false;
  private readonly client: Client;
  private readonly logger: ILogger;
  private readonly exitHelper: IExitHelper;

  constructor(params: { account: number; logger: ILogger; exitHelper: IExitHelper }) {
    this.client = createClient(params.account);
    this.logger = params.logger;
    this.exitHelper = params.exitHelper;
  }

  private async addOfflineCallback() {
    this.client.on('system.offline', () => {
      this.exitHelper.onUnexpectedExit('qq offline');
    });
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
    this.addOfflineCallback();
    try {
      if (password != null) {
        await this.client.login(password);
        await this.waitOnline();
        return Result.ok(1);
      }
      await this.client
        .on('system.login.qrcode', function (this: Client) {
          // 扫码后按回车登录
          process.stdin.once('data', () => {
            this.login();
          });
        })
        .login();
      await this.waitOnline();
      return Result.ok(1);
    } catch (e) {
      this.logger.error('failed to login qq', e);
      return Result.err(e);
    }
  }

  async sendMessageToUser(userId: number, message: string): Promise<Result.Result<1, unknown>> {
    if (!this.loggedIn) {
      const errorMsg = `try to post message ${message} to iser ${userId} when not logged in`;
      this.logger.error(errorMsg);
      return Result.err('not logged in');
    } else if (!this.client.fl.has(userId)) {
      this.logger.error(`no friend with id ${userId}`);
      return Result.err(`no friend with id ${userId}`);
    }
    const user = this.client.pickFriend(userId, true);
    try {
      await user.sendMsg(message);
      return Result.ok(1);
    } catch (e) {
      this.logger.error(`failed to send message to admin ${userId}`);
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
      const errorMsg = `try to post message ${message} to group ${groupId} when not logged in`;
      this.logger.error(errorMsg);
      return Result.err(errorMsg);
    } else if (!this.client.gl.has(groupId)) {
      this.logger.error(`no group with id ${groupId}`);
      return Result.err(`no group with id ${groupId}`);
    }
    const group = this.client.pickGroup(groupId, true);
    try {
      await group.sendMsg(message);
      this.logger.info(`${message} posted in group ${groupId}`);
      if (image != null) {
        await group.sendMsg(segment.image(image));
        this.logger.info(`image sent to group ${groupId}`);
      }
      return Result.ok(1);
    } catch (e) {
      this.logger.error(`failed to send message to group ${groupId}`);
      this.logger.error(e);
      return Result.err(e);
    }
  }
}
