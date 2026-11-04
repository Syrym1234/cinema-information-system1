'use strict';
const express = require('express');
const { sql, pool } = require('./db');
const { parseId, validateMovie } = require('./validation');
const router = express.Router();
const route = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
const select = `SELECT m.movie_id,m.title,m.genre_id,m.duration_min,m.age_rating,m.release_year,
  m.rating,m.description,g.genre_name FROM dbo.Movies m
  JOIN dbo.Genres g ON g.genre_id=m.genre_id`;
router.param('id', (req, res, next, raw) => {
  req.movieId = parseId(raw);
  if (!req.movieId) return res.status(400).json({ error: 'Фильм ID: 1..2147483647 бүтін саны қажет', code: 'INVALID_ID' });
  next();
});
function body(req, res, next) {
  if (!req.is('application/json')) return res.status(415).json({ error: 'Content-Type: application/json қажет', code: 'UNSUPPORTED_MEDIA_TYPE' });
  const result = validateMovie(req.body);
  if (result.errors.length) return res.status(400).json({ error: 'Фильм деректері қате', code: 'VALIDATION_ERROR', details: result.errors });
  req.movie = result.value;
  next();
}
function input(request, movie) {
  return request.input('title', sql.NVarChar(150), movie.title)
    .input('genre_id', sql.Int, movie.genre_id).input('duration_min', sql.Int, movie.duration_min)
    .input('age_rating', sql.Int, movie.age_rating).input('release_year', sql.Int, movie.release_year)
    .input('rating', sql.Decimal(3, 1), movie.rating).input('description', sql.NVarChar(400), movie.description);
}
const notFound = res => res.status(404).json({ error: 'Фильм табылмады', code: 'MOVIE_NOT_FOUND' });
function relationError(err, res) {
  if (err.number !== 547) throw err;
  return res.status(400).json({ error: 'Мұндай жанр жоқ. /api/metadata арқылы жанр таңдаңыз', code: 'GENRE_NOT_FOUND' });
}
router.get('/', route(async (_req, res) => {
  const p = await pool();
  res.json((await p.request().query(`${select} ORDER BY m.rating DESC,m.title ASC,m.movie_id ASC`)).recordset);
}));
router.get('/:id', route(async (req, res) => {
  const p = await pool();
  const result = await p.request().input('id', sql.Int, req.movieId).query(`${select} WHERE m.movie_id=@id`);
  if (!result.recordset.length) return notFound(res);
  res.json(result.recordset[0]);
}));
router.post('/', body, route(async (req, res) => {
  const p = await pool();
  try {
    const result = await input(p.request(), req.movie).query(`INSERT INTO dbo.Movies
      (title,genre_id,duration_min,age_rating,release_year,rating,description)
      OUTPUT INSERTED.* VALUES (@title,@genre_id,@duration_min,@age_rating,@release_year,@rating,@description)`);
    const movie = result.recordset[0];
    res.location(`/api/movies/${movie.movie_id}`).status(201).json(movie);
  } catch (err) { relationError(err, res); }
}));
router.put('/:id', body, route(async (req, res) => {
  const p = await pool();
  try {
    const result = await input(p.request().input('id', sql.Int, req.movieId), req.movie).query(`UPDATE dbo.Movies
      SET title=@title,genre_id=@genre_id,duration_min=@duration_min,age_rating=@age_rating,
        release_year=@release_year,rating=@rating,description=@description
      OUTPUT INSERTED.* WHERE movie_id=@id`);
    if (!result.recordset.length) return notFound(res);
    res.json(result.recordset[0]);
  } catch (err) { relationError(err, res); }
}));
router.delete('/:id', route(async (req, res) => {
  const p = await pool();
  try {
    const result = await p.request().input('id', sql.Int, req.movieId)
      .query('DELETE FROM dbo.Movies OUTPUT DELETED.movie_id WHERE movie_id=@id');
    if (!result.recordset.length) return notFound(res);
    res.json({ message: 'Фильм сәтті жойылды', movie_id: result.recordset[0].movie_id });
  } catch (err) {
    if (err.number !== 547) throw err;
    res.status(409).json({ error: 'Фильмге сеанстар байланысқан. Фильмді жоюға болмайды', code: 'MOVIE_HAS_SESSIONS' });
  }
}));
for (const [url, allow] of [['/', 'GET, HEAD, POST'], ['/:id', 'GET, HEAD, PUT, DELETE']]) {
  router.all(url, (req, res) => {
    res.set('Allow', `${allow}, OPTIONS`);
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    res.status(405).json({ error: 'Бұл HTTP әдісі қолдау таппайды', code: 'METHOD_NOT_ALLOWED' });
  });
}
module.exports = router;
