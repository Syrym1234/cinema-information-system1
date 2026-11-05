'use strict';
const express = require('express');
const { sql, pool } = require('./db');
const { parseId } = require('./validation');
const { tables, findTable, parseTableQuery } = require('./table-query');
const router = express.Router();
const route = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
router.get('/', route(async (_req, res) => {
  const p = await pool();
  const counts = await p.request().query(tables.map(table =>
    `SELECT N'${table.name}' AS table_name,COUNT(*) AS row_count FROM dbo.[${table.name}]`).join(' UNION ALL '));
  res.json(tables.map(table => ({ table: table.name, primary_key: table.key, columns: table.columns,
    row_count: counts.recordset.find(row => row.table_name === table.name).row_count,
    endpoint: `/api/tables/${table.name}` })));
}));
router.param('name', (req, res, next, name) => {
  req.table = findTable(name);
  if (!req.table) return res.status(404).json({ error: 'Мұндай кесте API-де жоқ', code: 'TABLE_NOT_FOUND', tables: tables.map(table => table.name) });
  next();
});
router.get('/:name', route(async (req, res) => {
  let query;
  try { query = parseTableQuery(req.table, req.query); }
  catch (err) { return res.status(400).json({ error: err.message, code: 'INVALID_QUERY' }); }
  const p = await pool(), request = p.request();
  for (const parameter of query.parameters) {
    const type = { int: sql.Int, text: sql.NVarChar(402), rating: sql.Decimal(3, 1), price: sql.Decimal(10, 2) }[parameter.type];
    request.input(parameter.name, type, parameter.value);
  }
  res.json((await request.query(query.sql)).recordset);
}));
router.get('/:name/:id', route(async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'ID: 1..2147483647 бүтін саны қажет', code: 'INVALID_ID' });
  const p = await pool(), table = req.table;
  const result = await p.request().input('id', sql.Int, id).query(
    `SELECT ${table.columns.map(field => `[${field}]`).join(',')} FROM dbo.[${table.name}] WHERE [${table.key}]=@id`);
  if (!result.recordset.length) return res.status(404).json({ error: 'Жазба табылмады', code: 'ROW_NOT_FOUND' });
  res.json(result.recordset[0]);
}));
for (const path of ['/', '/:name', '/:name/:id']) router.all(path, (req, res) => {
  res.set('Allow', 'GET, HEAD, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  res.status(405).json({ error: 'Кестелерді қарау үшін GET қолданыңыз', code: 'METHOD_NOT_ALLOWED' });
});
module.exports = router;
