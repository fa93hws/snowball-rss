import { rssHubService } from '../rsshub-service';
import RSSHub from 'rsshub';

describe('rssHubService', () => {
  it('pass option to RSSHub.init', () => {
    const options = {
      CACHE_TYPE: 'redis' as const,
      requestRetry: 5,
    };
    const fakeInit = jest.spyOn(RSSHub, 'init').mockImplementation(jest.fn());
    rssHubService.init(options);
    expect(fakeInit).toHaveBeenCalledWith(options);
    fakeInit.mockRestore();
  });

  it('pass url to RSSHub.fetch', () => {
    const fakeRequest = jest.spyOn(RSSHub, 'request').mockImplementation(jest.fn());
    rssHubService.request('url');
    expect(fakeRequest).toHaveBeenCalledWith('url');
    fakeRequest.mockRestore();
  });
});
