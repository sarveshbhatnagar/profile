import { test } from 'node:test';
import assert from 'node:assert';

/** Mirrors logic in js/terminal-blog.js (blog listing) */
function uniqueSortedTags(posts) {
  const set = new Set();
  for (const p of posts) {
    for (const t of p.tags || []) set.add(t);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function countPostsWithTag(posts, tag) {
  return posts.filter(p => (p.tags || []).includes(tag)).length;
}

test('uniqueSortedTags collects and sorts', () => {
  const posts = [
    { id: 'a', tags: ['zebra', 'alpha'] },
    { id: 'b', tags: ['alpha'] },
    { id: 'c', tags: [] }
  ];
  assert.deepStrictEqual(uniqueSortedTags(posts), ['alpha', 'zebra']);
});

test('countPostsWithTag', () => {
  const posts = [
    { id: '1', tags: ['serverless', 'systems'] },
    { id: '2', tags: ['life'] },
    { id: '3', tags: ['serverless'] }
  ];
  assert.strictEqual(countPostsWithTag(posts, 'serverless'), 2);
  assert.strictEqual(countPostsWithTag(posts, 'life'), 1);
  assert.strictEqual(countPostsWithTag(posts, 'missing'), 0);
});
