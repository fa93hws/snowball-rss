import * as sanitizeHtml from 'sanitize-html';

export namespace Sanitize {
  export function html(str: string) {
    return sanitizeHtml(str, {
      allowedTags: ['blockquote'],
    });
  }
}
