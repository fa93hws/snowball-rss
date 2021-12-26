import { WebClient } from '@slack/web-api';
import type { KnownBlock } from '@slack/web-api';
import { Result } from '@utils/result';
import type { ILogger } from './logging-service';

type PostMessageParams = {
  // see https://api.slack.com/methods/chat.postMessage#arg_channel
  channel: string;
  // https://api.slack.com/methods/chat.postMessage#arg_text
  text: string;

  // text that will be displayed on toaster
  abstract: string;

  image?: {
    content: Buffer;
    filename: string;
  };
};

export interface ISlackService {
  postSimpleMessage(params: PostMessageParams): Promise<Result.Result<1, unknown>>;
}

export class SlackService implements ISlackService {
  private readonly client: WebClient;
  private readonly userToken: string;
  private readonly logger: ILogger;

  // bot user token is used to post message and user token is used to upload image
  constructor(
    params: { botUserToken: string; userToken: string; logger: ILogger },
    override?: {
      WebClient?: typeof WebClient;
    },
  ) {
    this.userToken = params.userToken;
    const WebClientImpl = override?.WebClient ?? WebClient;
    this.client = new WebClientImpl(params.botUserToken, {
      retryConfig: {
        retries: 5,
        minTimeout: 1 * 1000,
        maxRetryTime: 60 * 1000,
      },
    });
    this.logger = params.logger;
  }

  private async uploadFile(file: Buffer, filename: string): Promise<Result.Result<string, Error>> {
    const response = await this.client.files.upload({
      file,
      filename,
      token: this.userToken,
    });
    if (!response.ok || response.file == null || response.file.id == null) {
      this.logger.error('failed to upload file: ' + JSON.stringify(response));
      return Result.err(new Error(`error uploading file, error is ${response.error}`));
    } else {
      this.logger.verbose('file uploaded, file id: ' + response.file.id);
      return Result.ok(response.file.id);
    }
  }

  private async makeFilePublic(fileId: string): Promise<Result.Result<string, Error>> {
    const response = await this.client.files.sharedPublicURL({
      token: this.userToken,
      file: fileId,
    });
    if (!response.ok || response.file == null) {
      this.logger.error('failed to make file public: ' + JSON.stringify(response));
      return Result.err(
        new Error(`error making file public, fildId is ${fileId}, error is ${response.error}`),
      );
    } else if (response.file.permalink_public == null || response.file.url_private == null) {
      this.logger.error(
        'file uploaded, but no permalink_public or url_private got returned: ' + response,
      );
      return Result.err(
        new Error('file uploaded, but no permalink_public or url_private got returned'),
      );
    } else {
      const publicPermLink = response.file.permalink_public;
      const privateUrl = response.file.url_private;
      const parsedPermalink = publicPermLink.split('-');
      if (parsedPermalink.length < 2) {
        this.logger.error(`wrong permalink_public format: ${publicPermLink}`);
        return Result.err(new Error(`wrong permalink_public format: ${publicPermLink}`));
      }
      const pubSecret = parsedPermalink[parsedPermalink.length - 1];
      const url = privateUrl + `?pub_secret=${pubSecret}`;
      this.logger.verbose('file shared, url: ' + url);
      return Result.ok(url);
    }
  }

  private async uploadFileAndMakePublic(
    file: Buffer,
    filename: string,
  ): Promise<Result.Result<string, unknown>> {
    try {
      const uploadFileResult = await this.uploadFile(file, filename);
      if (!uploadFileResult.isOk) {
        return uploadFileResult;
      }
      const fileId = uploadFileResult.value;
      const shareFileResult = await this.makeFilePublic(fileId);
      return shareFileResult;
    } catch (e) {
      this.logger.error('error uploading file due to promise rejection: ');
      this.logger.error(e);
      return Result.err(e);
    }
  }

  async postSimpleMessage(params: PostMessageParams): Promise<Result.Result<1, unknown>> {
    const blocks: KnownBlock[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: params.text,
        },
      },
    ];

    if (params.image != null) {
      const { content, filename } = params.image;
      const uploadFileResult = await this.uploadFileAndMakePublic(content, filename);
      if (!uploadFileResult.isOk) {
        return uploadFileResult;
      }
      blocks.push({
        type: 'image',
        title: {
          type: 'plain_text',
          text: filename,
        },
        image_url: uploadFileResult.value,
        alt_text: filename,
      });
    }
    try {
      const postMessageResult = await this.client.chat.postMessage({
        channel: params.channel,
        blocks,
        text: params.abstract,
      });
      if (!postMessageResult.ok) {
        this.logger.error('error posting message: ' + JSON.stringify(postMessageResult));
        return Result.err(new Error('error posting message: ' + postMessageResult.error));
      }
      this.logger.info('message posted, content: ' + JSON.stringify(blocks));
      return Result.ok(1);
    } catch (e) {
      return Result.err(e);
    }
  }
}
