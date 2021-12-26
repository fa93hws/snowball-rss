import { Result } from '@utils/result';
import { createClient, segment } from 'oicq';
import type { Client } from 'oicq';

export class QQService {
  private loggedIn = false;
  private readonly client: Client;

  constructor(params: { account: number }) {
    this.client = createClient(params.account);
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
      await group.sendMsg(message);
      image && (await group.sendMsg(segment.image(image)));
      return Result.ok(1);
    } catch (e) {
      return Result.err(e);
    }
  }
}
