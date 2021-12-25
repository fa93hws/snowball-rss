import { WebClient } from '@slack/web-api';
import type { KnownBlock } from '@slack/web-api';
import { Result } from '@utils/result';
import * as fs from 'fs';
import * as path from 'path';

type PostMessageParams = {
  // see https://api.slack.com/methods/chat.postMessage#arg_blocks
  blocks: KnownBlock[];
  // see https://api.slack.com/methods/chat.postMessage#arg_channel
  channel: string;

  image?: Buffer;
};

export interface ISlackService {
  postMessage(params: PostMessageParams): Promise<void>;
}

export class SlackService implements ISlackService {
  private readonly client: WebClient;
  private readonly botUserToken: string;
  private readonly userToken: string;

  constructor(params: { botUserToken: string; userToken: string }) {
    this.botUserToken = params.botUserToken;
    this.userToken = params.userToken;
    this.client = new WebClient();
  }

  async uploadFile(file: Buffer): Promise<Result.Result<string>> {
    const response = await this.client.files.upload({
      file,
      filename: 'screenshot.jpg',
      token: this.userToken,
    });
    if (response.ok && response.file?.id != null) {
      const fileId = response.file.id;
      const sharedResult = await this.client.files.sharedPublicURL({
        token: this.userToken,
        file: fileId,
      });
      const parsedPermalink = sharedResult!.file!.permalink_public!.split('-');
      const pubSecret = parsedPermalink[parsedPermalink.length - 1];
      const imageUrl = sharedResult!.file!.url_private + `?pub_secret=${pubSecret}`;
      console.log(imageUrl);
      // const
      return Result.ok(imageUrl);
    } else {
      return Result.err('error uploading file');
    }
  }

  async postMessage(params: PostMessageParams): Promise<void> {
    // if (params.image) {
    const image = fs.readFileSync(path.join(__dirname, '111.jpg'));
    const fileResult = await this.uploadFile(image);
    const imageUrl = Result.unwrap(fileResult);
    await this.client.chat.postMessage({
      channel: 'C02S9US4XEV',
      token: this.botUserToken,
      text: 'title!',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*title*',
          },
        },
        {
          type: 'image',
          title: {
            type: 'plain_text',
            text: 'screenshot.png',
          },
          image_url: imageUrl,
          alt_text: 'screenshot',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*title*',
          },
        },
      ],
    });
  }
}
