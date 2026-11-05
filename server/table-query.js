'use strict';
// Only these seven schema definitions can become SQL identifiers.
const tables = [
  { name: 'Genres', key: 'genre_id', columns: ['genre_id', 'genre_name'], text: ['genre_name'] },
  { name: 'Movies', key: 'movie_id', columns: ['movie_id', 'title', 'genre_id', 'duration_min', 'age_rating', 'release_year', 'rating', 'description'], text: ['title', 'description'], ids: ['genre_id'] },
  { name: 'Halls', key: 'hall_id', columns: ['hall_id', 'hall_name', 'capacity'], text: ['hall_name'] },
  { name: 'Sessions', key: 'session_id', columns: ['session_id', 'movie_id', 'hall_id', 'start_at', 'price', 'status'], text: ['status'], ids: ['movie_id', 'hall_id'] },
  { name: 'Customers', key: 'customer_id', columns: ['customer_id', 'full_name', 'email'], text: ['full_name', 'email'] },
  { name: 'Tickets', key: 'ticket_id', columns: ['ticket_id', 'session_id', 'customer_id', 'seat_number', 'price', 'purchased_at'], text: [], ids: ['session_id', 'customer_id'] },
  { name: 'MenuItems', key: 'menu_item_id', columns: ['menu_item_id', 'item_name', 'category', 'price'], text: ['item_name', 'category'] }
];
const registry = new Map(tables.map(table => [table.name.toLowerCase(), table]));
const { parseId } = require('./validation');
function findTable(name) { return registry.get(String(name).toLowerCase()); }
function parseTableQuery(table, query) {
  const allowed = new Set(['search', 'sort', 'order', 'limit', ...(table.ids || [])]);
  for (const field of ['rating', 'price']) if (table.columns.includes(field)) {
    allowed.add(`min_${field}`); allowed.add(`max_${field}`);
  }
  for (const [key, value] of Object.entries(query)) {
    if (!allowed.has(key) || typeof value !== 'string') throw new Error(`Қолдау таппайтын параметр: ${key}`);
  }
  const sort = query.sort || table.key;
  const order = (query.order || 'asc').toLowerCase();
  if (!table.columns.includes(sort)) throw new Error('sort: осы кестенің баған атауы қажет');
  if (!['asc', 'desc'].includes(order)) throw new Error('order: asc немесе desc қажет');
  const conditions = [], parameters = [];
  if (query.search !== undefined) {
    const search = query.search.trim();
    if (!table.text.length || !search || search.length > 100) throw new Error('search: мәтіндік бағаны бар кесте және 1..100 таңба қажет');
    parameters.push({ name: 'search', type: 'text', value: `%${search.replace(/[\[\]%_]/g, '[$&]')}%` });
    conditions.push('(' + table.text.map(field => `[${field}] LIKE @search`).join(' OR ') + ')');
  }
  for (const field of table.ids || []) if (query[field] !== undefined) {
    const value = parseId(query[field]);
    if (value === null) throw new Error(`${field}: оң INT қажет`);
    conditions.push(`[${field}]=@${field}`); parameters.push({ name: field, type: 'int', value });
  }
  for (const field of ['rating', 'price']) for (const [prefix, operator] of [['min', '>='], ['max', '<=']]) {
    const key = `${prefix}_${field}`;
    if (query[key] === undefined) continue;
    const raw = query[key];
    const value = Number(raw);
    const max = field === 'rating' ? 10 : 99999999.99;
    const decimals = field === 'rating' ? 1 : 2;
    if (!new RegExp(`^\\d+(?:\\.\\d{1,${decimals}})?$`).test(raw) || !Number.isFinite(value) || value > max) {
      throw new Error(`${key}: 0..${max}, ең көбі ${decimals} ондық таңба қажет`);
    }
    conditions.push(`[${field}]${operator}@${key}`); parameters.push({ name: key, type: field, value });
  }
  for (const field of ['rating', 'price']) if (query[`min_${field}`] !== undefined && query[`max_${field}`] !== undefined &&
      Number(query[`min_${field}`]) > Number(query[`max_${field}`])) throw new Error(`min_${field} max_${field} мәнінен аспауы керек`);
  let top = '';
  if (query.limit !== undefined) {
    const limit = parseId(query.limit);
    if (limit === null || limit > 1000) throw new Error('limit: 1..1000 қажет');
    parameters.push({ name: 'limit', type: 'int', value: limit }); top = 'TOP (@limit) ';
  }
  const ordering = `[${sort}] ${order.toUpperCase()}` + (sort === table.key ? '' : `, [${table.key}] ASC`);
  return { sql: `SELECT ${top}${table.columns.map(field => `[${field}]`).join(',')} FROM dbo.[${table.name}]` +
    (conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '') + ` ORDER BY ${ordering}`, parameters };
}
module.exports = { tables, findTable, parseTableQuery };
