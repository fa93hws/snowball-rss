import _sanitizeHtml from 'sanitize-html';

export function sanitizeHtml(str: string) {
  return _sanitizeHtml(str, {
    allowedTags: ['blockquote'],
  });
}
