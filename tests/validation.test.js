'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseId, validateMovie } = require('../server/validation');
const valid = { title: '  Қазақша фильм  ', genre_id: 1, duration_min: 100, age_rating: 12, release_year: 2026, rating: 8.5, description: 'Оқу фильмі' };
test('IDs cannot overflow SQL INT or inject SQL', () => {
  for (const value of ['0', '-1', '1.2', '1e2', '2147483648', '1 OR 1=1', '01', ' 1', null]) assert.equal(parseId(value), null);
  assert.equal(parseId('2147483647'), 2147483647);
});
test('movie accepts Kazakh text and normalizes surrounding whitespace', () => {
  assert.deepEqual(validateMovie(valid), { errors: [], value: { ...valid, title: 'Қазақша фильм' } });
});
test('full PUT requires every writable field and rejects unknown fields', () => {
  for (const key of Object.keys(valid)) {
    const copy = { ...valid }; delete copy[key];
    assert.ok(validateMovie(copy).errors.length, key);
  }
  assert.ok(validateMovie({ ...valid, movie_id: 123 }).errors.length);
});
test('numeric fields reject strings, null, rounding, overflow and unsupported ages', () => {
  for (const [key, values] of Object.entries({genre_id: ['1', null, -1, 2147483648], duration_min: [0, 601, 3.5], age_rating: [7, '12', null], release_year: [1887, 2101], rating: [NaN, Infinity, 10.1, -0.1, 8.55, '8.5', null]})) {
    for (const value of values) assert.ok(validateMovie({ ...valid, [key]: value }).errors.length, `${key}=${value}`);
  }
});
test('invalid JSON shapes and oversized or empty text are rejected', () => {
  for (const body of [null, [], 'text', 5, {}, { ...valid, title: ' ' }, { ...valid, title: 'x'.repeat(151) }, { ...valid, description: 'x'.repeat(401) }]) assert.ok(validateMovie(body).errors.length);
});
