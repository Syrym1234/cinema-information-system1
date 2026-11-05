'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { findTable, parseTableQuery } = require('../server/table-query');
test('table and ordering identifiers cannot contain SQL or prototype properties', () => {
  for (const name of ['Movies; DROP TABLE Movies', '__proto__', 'constructor', 'sys.tables']) assert.equal(findTable(name), undefined);
  assert.equal(findTable('mOvIeS').name, 'Movies');
  for (const query of [{ sort: 'rating DESC; DROP TABLE Movies' }, { order: 'desc;--' }, { sql: 'SELECT * FROM Customers' }, { search: ['x', 'y'] }]) {
    assert.throws(() => parseTableQuery(findTable('Movies'), query));
  }
});
test('search punctuation is literal and values stay outside SQL text', () => {
  const needle = "x%' OR 1=1 --_[";
  const query = parseTableQuery(findTable('Movies'), { search: needle });
  assert.ok(!query.sql.includes(needle));
  assert.equal(query.parameters[0].value, "%x[%]' OR 1=1 --[_][[]%");
});
test('rating, foreign-key and price filters enforce SQL ranges and scalar values', () => {
  for (const query of [{ min_rating: '8.55' }, { min_rating: '11' }, { genre_id: '2147483648' }, { min_rating: '9', max_rating: '8' }, { limit: '1001' }]) {
    assert.throws(() => parseTableQuery(findTable('Movies'), query));
  }
  assert.throws(() => parseTableQuery(findTable('Tickets'), { min_price: '100000000' }));
  assert.throws(() => parseTableQuery(findTable('Tickets'), { search: 'x' }));
  const query = parseTableQuery(findTable('Movies'), { genre_id: '3', min_rating: '8', sort: 'rating', order: 'desc', limit: '5' });
  assert.ok(query.sql.includes('[rating]>=@min_rating'));
  assert.ok(query.sql.endsWith('ORDER BY [rating] DESC, [movie_id] ASC'));
});
