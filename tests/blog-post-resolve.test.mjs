import { test } from 'node:test';
import assert from 'node:assert';

/** Keep in sync with hasInlinePostBody() in js/terminal-blog.js */
function hasInlinePostBody(post) {
  return post != null && typeof post.content === 'string';
}

test('hasInlinePostBody is true when content is a non-empty HTML string', () => {
  assert.strictEqual(hasInlinePostBody({ id: 'x', content: '<p>hi</p>' }), true);
});

test('hasInlinePostBody is true for empty string content (explicit inline body)', () => {
  assert.strictEqual(hasInlinePostBody({ id: 'x', content: '' }), true);
});

test('hasInlinePostBody is false when content is missing', () => {
  assert.strictEqual(hasInlinePostBody({ id: 'x', title: 't' }), false);
});

test('hasInlinePostBody is false for null/undefined', () => {
  assert.strictEqual(hasInlinePostBody(null), false);
  assert.strictEqual(hasInlinePostBody(undefined), false);
});
