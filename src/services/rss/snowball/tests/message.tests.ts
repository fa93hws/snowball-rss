import { Result } from '@utils/result';
import { Post, Message } from '../message';

describe('Post', () => {
  it('expect object input', () => {
    expect(Post.fromRaw(null)).toMatchObject({ isOk: false });
    expect(Post.fromRaw(1)).toMatchObject({ isOk: false });
    expect(Post.fromRaw(false)).toMatchObject({ isOk: false });
    expect(Post.fromRaw('abcdefg')).toMatchObject({ isOk: false });
    expect(
      Post.fromRaw({
        title: 'title1',
        description: 'description1',
        pubDate: 'Wed, 22 Dec 2021 02:16:58 GMT',
        link: 'link1',
      }),
    ).toEqual({
      isOk: true,
      value: new Post(
        'title1',
        'description1',
        new Date('2021-12-22T02:16:58Z'),
        'link1',
      ),
    });
  });

  it('expects string for title', () => {
    expect(
      Post.fromRaw({
        title: 1,
        description: 'description1',
        pubDate: 'Wed, 22 Dec 2021 02:16:58 GMT',
        link: 'link1',
      }),
    ).toMatchObject({ isOk: false });
  });

  it('expects string for description', () => {
    expect(
      Post.fromRaw({
        title: 'title1',
        description: 123,
        pubDate: 'Wed, 22 Dec 2021 02:16:58 GMT',
        link: 'link1',
      }),
    ).toMatchObject({ isOk: false });
  });

  it('expects string for pubDate', () => {
    expect(
      Post.fromRaw({
        title: 'title1',
        description: 'description1',
        pubDate: 123123123,
        link: 'link1',
      }),
    ).toMatchObject({ isOk: false });
  });

  it('expects valid date string for pubDate', () => {
    expect(
      Post.fromRaw({
        title: 'title1',
        description: 'description1',
        pubDate: 'abc',
        link: 'link1',
      }),
    ).toMatchObject({ isOk: false });
  });

  it('expects string for link', () => {
    expect(
      Post.fromRaw({
        title: 'title 1',
        description: 'description1',
        pubDate: 'Wed, 22 Dec 2021 02:16:58 GMT',
        link: 1,
      }),
    ).toMatchObject({ isOk: false });
  });
});

describe('Message', () => {
  const rawPosts = [
    {
      title: 'title1',
      description: 'description1',
      pubDate: 'Wed, 22 Dec 2021 02:16:58 GMT',
      link: 'link1',
    },
  ];
  const posts = rawPosts.map((raw) => Result.unwrap(Post.fromRaw(raw)));

  it('expect object input', () => {
    expect(Message.fromRaw(null)).toMatchObject({ isOk: false });
    expect(Message.fromRaw(1)).toMatchObject({ isOk: false });
    expect(Message.fromRaw(false)).toMatchObject({ isOk: false });
    expect(Message.fromRaw('abcdefg')).toMatchObject({ isOk: false });
    expect(
      Message.fromRaw({
        item: rawPosts,
        updated: 'Wed, 22 Dec 2021 02:16:58 GMT',
      }),
    ).toEqual({
      isOk: true,
      value: new Message(new Date('2021-12-22T02:16:58Z'), posts),
    });
  });

  it('expect array for item', () => {
    expect(
      Message.fromRaw({
        item: {},
        updated: 'Wed, 22 Dec 2021 02:16:58 GMT',
      }),
    ).toMatchObject({ isOk: false });
  });

  it('expect every item in the array is valid raw post for item', () => {
    expect(
      Message.fromRaw({
        item: [...rawPosts, ...rawPosts, {}],
        updated: 'Wed, 22 Dec 2021 02:16:58 GMT',
      }),
    ).toMatchObject({ isOk: false });
  });

  it('expects string for updated', () => {
    expect(
      Message.fromRaw({
        item: rawPosts,
        updated: 123123,
      }),
    ).toMatchObject({ isOk: false });
  });

  it('expects valid date string for updated', () => {
    expect(
      Message.fromRaw({
        item: rawPosts,
        updated: 'abcd',
      }),
    ).toMatchObject({ isOk: false });
  });
});
