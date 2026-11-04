'use strict';
const fields = ['title', 'genre_id', 'duration_min', 'age_rating', 'release_year', 'rating', 'description'];
function parseId(value) {
  return /^[1-9]\d*$/.test(String(value)) && Number.isInteger(Number(value)) && Number(value) <= 2147483647
    ? Number(value) : null;
}
function validateMovie(body) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['JSON объектісі қажет'], value: null };
  }
  for (const key of Object.keys(body)) {
    if (!fields.includes(key)) errors.push(`Белгісіз өріс: ${key}`);
  }
  const value = {};
  for (const [key, max] of [['title', 150], ['description', 400]]) {
    if (typeof body[key] !== 'string' || !body[key].trim() || body[key].trim().length > max) {
      errors.push(`${key}: бос емес мәтін, ең көбі ${max} таңба`);
    } else value[key] = body[key].trim();
  }
  for (const [key, min, max] of [['genre_id', 1, 2147483647], ['duration_min', 1, 600], ['release_year', 1888, 2100]]) {
    if (!Number.isInteger(body[key]) || body[key] < min || body[key] > max) errors.push(`${key}: ${min}..${max} бүтін саны қажет`);
    else value[key] = body[key];
  }
  if (![0, 6, 12, 16, 18, 21].includes(body.age_rating)) errors.push('age_rating: 0, 6, 12, 16, 18 немесе 21');
  else value.age_rating = body.age_rating;
  if (typeof body.rating !== 'number' || !Number.isFinite(body.rating) || body.rating < 0 || body.rating > 10 ||
      Math.abs(body.rating * 10 - Math.round(body.rating * 10)) > 1e-8) errors.push('rating: 0..10, ең көбі бір ондық таңба');
  else value.rating = body.rating;
  return { errors, value };
}
module.exports = { parseId, validateMovie };
