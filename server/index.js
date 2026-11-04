'use strict';
require('dotenv').config();
const express = require('express');
const path = require('path');
const { sql, pool, closePool } = require('./db');
const {chooseSort} = require('./filters');
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.use('/api/movies', require('./movies'));
app.get('/api/openapi.json', (_req, res) => res.sendFile(path.join(__dirname, '..', 'docs', 'lab10', 'openapi.json')));
app.use(express.static(path.join(__dirname, '..', 'public')));

function route(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
}
function positiveNumber(value) {
  return /^\d+$/.test(String(value)) && Number(value) > 0 && Number.isSafeInteger(Number(value)) ? Number(value) : null;
}
app.get('/api/health', route(async (_req,res) => {
  const p = await pool();
  const result = await p.request().query('SELECT DB_NAME() AS db_name, COUNT(*) AS movies FROM Movies');
  res.json(result.recordset[0]);
}));
app.get('/api/metadata', route(async (_req,res) => {
  const p = await pool();
  const genres = await p.request().query('SELECT genre_id, genre_name FROM Genres ORDER BY genre_name');
  const halls = await p.request().query('SELECT hall_id, hall_name FROM Halls ORDER BY hall_id');
  res.json({genres:genres.recordset,halls:halls.recordset});
}));
app.get('/api/sessions', route(async (req,res) => {
  const p = await pool();
  const r = p.request();
  const cond = ["s.status = N'Жоспарланған'"];
  if (req.query.date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(req.query.date))) return res.status(400).json({error:'Күн қате'});
    r.input('date',sql.Date,req.query.date);
    cond.push('CAST(s.start_at AS DATE) = @date');
  }
  if (req.query.genre) {
    const id = positiveNumber(req.query.genre);
    if (!id) return res.status(400).json({error:'Жанр ID қате'});
    r.input('genre',sql.Int,id); cond.push('g.genre_id = @genre');
  }
  if (req.query.hall) {
    const id = positiveNumber(req.query.hall);
    if (!id) return res.status(400).json({error:'Зал ID қате'});
    r.input('hall',sql.Int,id); cond.push('h.hall_id = @hall');
  }
  if (req.query.search) {
    const term = String(req.query.search).trim();
    if (term.length > 80) return res.status(400).json({error:'Іздеу сөзі тым ұзын'});
    // LIKE ішіндегі арнайы символдарды іздеу мәтіні ретінде өңдеу.
    r.input('search',sql.NVarChar(180),`%${term.replace(/[\[\]%_]/g,'[$&')}%`);
    cond.push('m.title LIKE @search');
  }
  const result = await r.query(`SELECT TOP (150) s.session_id,s.start_at,s.price,m.movie_id,m.title,m.rating,
     m.description,m.duration_min,m.age_rating,g.genre_name,h.hall_name,h.capacity,
     (SELECT COUNT(*) FROM Tickets t WHERE t.session_id=s.session_id) AS sold_count
   FROM Sessions s JOIN Movies m ON m.movie_id=s.movie_id
   JOIN Genres g ON g.genre_id=m.genre_id JOIN Halls h ON h.hall_id=s.hall_id
   WHERE ${cond.join(' AND ')} ORDER BY ${chooseSort(req.query.sort)}`);
  res.json(result.recordset);
}));
app.get('/api/sessions/:id/seats', route(async (req,res) => {
  const id = positiveNumber(req.params.id);
  if(!id) return res.status(400).json({error:'Сеанс ID қате'});
  const p = await pool();
  const session = await p.request().input('id',sql.Int,id).query(`SELECT s.session_id,s.start_at,s.price,
      m.title,h.hall_name,h.capacity FROM Sessions s JOIN Movies m ON m.movie_id=s.movie_id
      JOIN Halls h ON h.hall_id=s.hall_id WHERE s.session_id=@id`);
  if(!session.recordset.length) return res.status(404).json({error:'Сеанс табылмады'});
  const seats = await p.request().input('id',sql.Int,id)
     .query('SELECT seat_number FROM Tickets WHERE session_id=@id ORDER BY seat_number');
  res.json({session:session.recordset[0], soldSeats:seats.recordset.map(x=>x.seat_number)});
}));
app.post('/api/tickets', route(async (req,res) => {
  const sessionId = positiveNumber(req.body.sessionId);
  const seatNumber = positiveNumber(req.body.seatNumber);
  const name = String(req.body.fullName || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!sessionId || !seatNumber || name.length < 2 || name.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120)
    return res.status(400).json({error:'Деректерді дұрыс толтырыңыз'});
  const p=await pool();
  const sess=await p.request().input('id',sql.Int,sessionId).query(`SELECT s.price,s.start_at,h.capacity FROM Sessions s
    JOIN Halls h ON h.hall_id=s.hall_id WHERE s.session_id=@id AND s.status=N'Жоспарланған' AND s.start_at>SYSDATETIME()`);
  if (!sess.recordset.length) return res.status(400).json({error:'Бұл сеанс басталған немесе жоқ'});
  if (seatNumber > sess.recordset[0].capacity) return res.status(400).json({error:'Мұндай орын жоқ'});
  const existing=await p.request().input('email',sql.NVarChar(120),email)
    .query('SELECT customer_id FROM Customers WHERE email=@email');
  let customerId;
  if (existing.recordset.length) customerId=existing.recordset[0].customer_id;
  else {
    try {
      await p.request().input('name',sql.NVarChar(100),name)
       .input('email',sql.NVarChar(120),email)
       .query('INSERT INTO Customers(full_name,email) VALUES (@name,@email)');
    } catch(err) { if (err.number!==2601 && err.number!==2627) throw err; }
    const c=await p.request().input('email',sql.NVarChar(120),email)
      .query('SELECT customer_id FROM Customers WHERE email=@email');
    customerId=c.recordset[0].customer_id;
  }
  try {
    await p.request().input('sid',sql.Int,sessionId)
      .input('cid',sql.Int,customerId).input('seat',sql.Int,seatNumber)
      .input('price',sql.Decimal(10,2),sess.recordset[0].price)
      .query('INSERT INTO Tickets(session_id,customer_id,seat_number,price) VALUES (@sid,@cid,@seat,@price)');
  } catch(err) {
    if(err.number===2601 || err.number===2627) return res.status(409).json({error:'Орын сатылып кеткен. Басқа орын таңдаңыз'});
    throw err;
  }
  const ticket=await p.request().input('sid',sql.Int,sessionId).input('seat',sql.Int,seatNumber)
    .query('SELECT ticket_id,price FROM Tickets WHERE session_id=@sid AND seat_number=@seat');
  res.status(201).json({ticketId:ticket.recordset[0].ticket_id,price:ticket.recordset[0].price,
     fullName:name,seatNumber,sessionId,message:'Демо билет сақталды (нақты төлем жоқ)'});
}));
app.get('/api/report',route(async (_req,res)=>{
  const p=await pool();
  const total=await p.request().query(`SELECT COUNT(*) AS ticket_count,
   ISNULL(SUM(price),0) AS revenue FROM Tickets`);
  const byMovie=await p.request().query(`SELECT m.title,COUNT(t.ticket_id) AS ticket_count,
      ISNULL(SUM(t.price),0) AS revenue FROM Movies m JOIN Sessions s ON s.movie_id=m.movie_id
      JOIN Tickets t ON t.session_id=s.session_id GROUP BY m.title
      ORDER BY ticket_count DESC,m.title ASC`);
  const counts=await p.request().query(`SELECT
    (SELECT COUNT(*) FROM Movies) AS movies,
    (SELECT COUNT(*) FROM Sessions) AS sessions,
    (SELECT COUNT(*) FROM Customers) AS customers`);
  res.json({totals:total.recordset[0],counts:counts.recordset[0],movies:byMovie.recordset});
}));
app.use('/api', (_req, res) => res.status(404).json({ error: 'API маршруты табылмады', code: 'ROUTE_NOT_FOUND' }));
app.use((err,_req,res,_next)=>{
  if (err.type === 'entity.parse.failed') return res.status(400).json({error:'JSON синтаксисі қате',code:'INVALID_JSON'});
  if (err.type === 'entity.too.large') return res.status(413).json({error:'Сұраныс көлемі 16 KB шегінен асты',code:'PAYLOAD_TOO_LARGE'});
  console.error('API error:', err.code || err.number || 'INTERNAL_ERROR');
  const unavailable = ['ELOGIN','ESOCKET','ETIMEOUT','ECONNCLOSED','EINSTLOOKUP','ENOTOPEN'].includes(err.code);
  res.status(unavailable ? 503 : 500).json({error: unavailable ? 'Деректер қорына қосылу мүмкін емес' : 'Сервер қатесі',code: unavailable ? 'DATABASE_UNAVAILABLE' : 'INTERNAL_ERROR'});
});
const port=Number(process.env.PORT||3000);
if (require.main === module) {
  const host = process.env.HOST || '127.0.0.1';
  const server = app.listen(port,host,()=>console.log(`Cinema School: http://${host}:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
    server.close(() => closePool().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
module.exports = app;
