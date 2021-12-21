import { Sanitize } from '../sanitize';

describe('html', () => {
  it('remove <a> tag', () => {
    const dirty = `before text<a href="http://xueqiu.com/n/%E7%BE%8E%E4%B8%BD%E5%BF%83%E6%83%85c3n" target="_blank">marked text</a>after text`;
    const clean = Sanitize.html(dirty);
    expect(clean).toEqual('before textmarked textafter text');
  });

  it('keep <blockquote> tag', () => {
    const dirty = 'before text<blockquote >marked text</blockquote>after text';
    const clean = Sanitize.html(dirty);
    expect(clean).toEqual(
      'before text<blockquote>marked text</blockquote>after text',
    );
  });
});
