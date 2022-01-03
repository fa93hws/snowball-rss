import { Result } from '@utils/result';
import type { TextChannel } from 'discord.js';
import { Client as _Client } from 'discord.js';
import type { ILogger } from './logging-service';

export interface IDiscordService {
  login: (token: string) => Promise<Result.Result<1, Error>>;
  logout: () => void;
  sendMessage(
    channelId: string,
    message: string,
    files?: Buffer[],
  ): Promise<Result.Result<1, Error>>;
}

export class DiscordService {
  private readonly client: _Client;
  private readonly logger: ILogger;

  constructor(params: { logger: ILogger }, Client: typeof _Client = _Client) {
    this.client = new Client({
      retryLimit: 5,
      intents: [],
    });
    this.logger = params.logger;
  }

  async login(token: string): Promise<Result.Result<1, Error>> {
    return new Promise((resolve) => {
      this.client
        .login(token)
        .then(() => {
          resolve(Result.ok(1));
          this.logger.info('discord bot logged in');
        })
        .catch((e) => {
          this.logger.error('failed to login', e);
          resolve(Result.err(new Error(`failed to login, ${e}`)));
        });
    });
  }

  logout(): void {
    this.client.destroy();
  }

  private getChannel(id: string): Promise<Result.Result<TextChannel, Error>> {
    if (this.client.channels.cache.has(id)) {
      const maybeChannel = this.client.channels.cache.get(id);
      if (maybeChannel != null) {
        if (maybeChannel.type === 'GUILD_TEXT') {
          this.logger.info(`channel ${id} found from cache`);
          return Promise.resolve(Result.ok(maybeChannel));
        } else {
          this.logger.error(`channel ${id} is not text channel`);
          return Promise.resolve(Result.err(new Error('channel is not a text channel')));
        }
      }
    }
    return new Promise((resolve) => {
      this.client.channels
        .fetch(id, { cache: true })
        .then((channel) => {
          if (channel == null) {
            resolve(Result.err(new Error('channel not found')));
            this.logger.error(`channel ${id} not found`);
            return;
          } else if (channel.type !== 'GUILD_TEXT') {
            resolve(Result.err(new Error('channel is not a text channel')));
            this.logger.error(`channel ${id} is not a text channel`);
            return;
          }
          resolve(Result.ok(channel));
        })
        .catch((e) => {
          return Result.err(e);
        });
    });
  }

  async sendMessage(
    channelId: string,
    message: string,
    files: Buffer[] = [],
  ): Promise<Result.Result<1, Error>> {
    const channelResult = await this.getChannel(channelId);
    if (!channelResult.isOk) {
      return channelResult;
    }
    const channel = channelResult.value;
    try {
      await channel.send({
        content: message,
        files: files.map((f) => ({ attachment: f })),
      });
      this.logger.info('message sent to discord');
      return Result.ok(1);
    } catch (e) {
      this.logger.error('message failed to send to discord', e);
      return Result.err(new Error(`failed to send message to channel, ${e}`));
    }
  }
}
