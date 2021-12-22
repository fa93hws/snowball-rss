declare module 'rsshub' {
  namespace RSSHub {
    export type RssHubParams = {
      CACHE_TYPE?: null | 'memory' | 'redis';
      requestRetry?: number;
      titleLengthLimit?: number;
    };
    const init: (options: RssHubParams) => void;
    const request: (url: string) => Promise<any>;
  }
  export = RSSHub;
}
