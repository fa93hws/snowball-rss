import RSSHub from 'rsshub';
import type { RssHubParams } from 'rsshub';

export interface IRssHubService {
  init(options: RssHubParams): void;

  request(url: string): Promise<any>;
}

class RssHubService implements IRssHubService {
  init(options: RssHubParams) {
    RSSHub.init(options);
  }

  request(url: string): Promise<any> {
    return RSSHub.request(url);
  }
}

export const rssHubService = new RssHubService();
