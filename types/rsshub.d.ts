declare module 'rsshub' {
  namespace RSSHub {
    const init: (options: {
      CACHE_TYPE?: null | 'memory' | 'redis';
      requestRetry?: number;
      titleLengthLimit?: number;
    }) => void;
    const request: (url: string) => Promise<any>;
  }
  export = RSSHub;
}
