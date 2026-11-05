'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { tables } = require('../server/table-query');
const root = path.join(__dirname, '..');
function request(name, url, tests, status = 200, method = 'GET') {
  return { name, request: { method, header: [], url: '{{baseUrl}}' + url },
    event: [{ listen: 'test', script: { type: 'text/javascript', exec: [
      `pm.test('HTTP ${status}', () => pm.response.to.have.status(${status}));`,
      "pm.test('JSON response', () => pm.response.to.be.json);", ...tests] } }] };
}
const rows = [request('00 Барлық кестелер және жолдар саны', '/api/tables', [
  "const rows=pm.response.json();pm.test('Seven tables',()=>pm.expect(rows.length).to.eql(7));",
  "pm.collectionVariables.set('tableCounts',JSON.stringify(Object.fromEntries(rows.map(r=>[r.table,r.row_count]))));"
])];
for (const table of tables) {
  rows.push(request(`${table.name} | барлық жолдар`, '/api/tables/' + table.name, [
    "const rows=pm.response.json();",
    `pm.test('Full table row count',()=>pm.expect(rows.length).to.eql(JSON.parse(pm.collectionVariables.get('tableCounts'))['${table.name}']));`,
    `pm.test('All table columns',()=>rows.forEach(row=>pm.expect(Object.keys(row).sort()).to.eql(${JSON.stringify(table.columns.slice().sort())})));`,
    `pm.collectionVariables.set('${table.key}',rows.length ? rows[0].${table.key} : 1);`
  ]));
  rows.push(request(`${table.name} | ID бойынша`, `/api/tables/${table.name}/{{${table.key}}}`, [
    `pm.test('Read expected ID',()=>pm.expect(pm.response.json().${table.key}).to.eql(Number(pm.collectionVariables.get('${table.key}'))));`
  ]));
}
const extra = [
  request('Фильмдер | рейтинг >= 8, кему реті', '/api/tables/Movies?min_rating=8&sort=rating&order=desc', [
    "const rows=pm.response.json();pm.test('Rating filter and order',()=>{pm.expect(rows.length).to.be.above(0);rows.forEach((r,i)=>{pm.expect(r.rating).to.be.at.least(8);if(i)pm.expect(rows[i-1].rating).to.be.at.least(r.rating);});});"
  ]),
  request('Фильмдер | жанр бойынша', '/api/tables/Movies?genre_id={{genre_id}}', [
    "pm.test('Genre filter',()=>pm.response.json().forEach(r=>pm.expect(r.genre_id).to.eql(Number(pm.collectionVariables.get('genre_id')))));"]
  ),
  request('Фильмдер | атауынан іздеу', '/api/tables/Movies?search=' + encodeURIComponent('Уақыт'), [
    "const rows=pm.response.json();pm.test('Kazakh search',()=>{pm.expect(rows.length).to.be.above(0);rows.forEach(r=>pm.expect(r.title+' '+r.description).to.include('Уақыт'));});"
  ]),
  request('Сеанстар | фильм бойынша', '/api/tables/Sessions?movie_id={{movie_id}}', [
    "pm.test('Movie filter',()=>pm.response.json().forEach(r=>pm.expect(r.movie_id).to.eql(Number(pm.collectionVariables.get('movie_id')))));"]
  ),
  request('Мәзір | баға бойынша, 3 жол', '/api/tables/MenuItems?min_price=1&sort=price&order=desc&limit=3', [
    "const rows=pm.response.json();pm.test('Price, limit and order',()=>{pm.expect(rows.length).to.be.at.most(3);rows.forEach((r,i)=>{pm.expect(r.price).to.be.at.least(1);if(i)pm.expect(rows[i-1].price).to.be.at.least(r.price);});});"
  ]),
  request('Белгісіз кесте', '/api/tables/sys.tables', ["pm.test('Code',()=>pm.expect(pm.response.json().code).to.eql('TABLE_NOT_FOUND'));"], 404),
  request('SQL өрнегі бар sort қабылданбайды', '/api/tables/Movies?sort=' + encodeURIComponent('rating DESC; DROP TABLE Movies'), ["pm.test('Code',()=>pm.expect(pm.response.json().code).to.eql('INVALID_QUERY'));"], 400),
  request('Қате ID', '/api/tables/Movies/0', ["pm.test('Code',()=>pm.expect(pm.response.json().code).to.eql('INVALID_ID'));"], 400),
  request('Жоқ ID', '/api/tables/Movies/2147483647', ["pm.test('Code',()=>pm.expect(pm.response.json().code).to.eql('ROW_NOT_FOUND'));"], 404),
  request('Қате параметр', '/api/tables/Movies?unknown=x', ["pm.test('Code',()=>pm.expect(pm.response.json().code).to.eql('INVALID_QUERY'));"], 400),
  request('Кестені қарау маршрутына POST', '/api/tables/Movies', ["pm.test('Code',()=>pm.expect(pm.response.json().code).to.eql('METHOD_NOT_ALLOWED'));"], 405, 'POST')
];
const result = { info: { name: 'Cinema Lab 10 | Барлық 7 кесте',
  schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  description: 'Жеті кестенің толық жолдары, ID бойынша оқу, сүзу, сұрыптау және қате сұраныстар. Тек оқу тексерулері; деректер өзгермейді.' },
  variable: [{ key: 'baseUrl', value: 'http://127.0.0.1:3000' }],
  item: [{ name: '01 Барлық жеті кесте', item: rows }, { name: '02 Сүзу және қате сұраныстар', item: extra }] };
fs.writeFileSync(path.join(root, 'postman/CinemaLab10_AllTables.postman_collection.json'), JSON.stringify(result, null, 2) + '\n');
console.log(`Generated ${rows.length + extra.length} requests for seven tables`);

const specificationPath = path.join(root, 'docs/lab10/openapi.json');
const specification = JSON.parse(fs.readFileSync(specificationPath, 'utf8'));
const jsonResponse = (description, schema) => ({ description, content: { 'application/json': { schema } } });
const error = jsonResponse('Invalid query, ID, or unavailable resource', { $ref: '#/components/schemas/Error' });
const choices = tables.map(table => ({ $ref: '#/components/schemas/Table' + table.name }));
for (const table of tables) specification.components.schemas['Table' + table.name] = {
  type: 'object', additionalProperties: false, required: table.columns,
  properties: Object.fromEntries(table.columns.map(field => [field,
    ['start_at', 'purchased_at'].includes(field) ? { type: 'string', format: 'date-time' } :
      table.text.includes(field) ? { type: 'string' } :
        ['rating', 'price'].includes(field) ? { type: 'number' } : { type: 'integer' }]))
};
specification.components.schemas.TableInfo = { type: 'object', required: ['table', 'primary_key', 'columns', 'row_count', 'endpoint'],
  properties: { table: { type: 'string', enum: tables.map(table => table.name) }, primary_key: { type: 'string' },
    columns: { type: 'array', items: { type: 'string' } }, row_count: { type: 'integer', minimum: 0 }, endpoint: { type: 'string' } } };
const tableParameter = { name: 'name', in: 'path', required: true, schema: { type: 'string', enum: tables.map(table => table.name) }, description: 'Case-insensitive whitelist of the seven CinemaSchoolDB tables.' };
const queryParameters = [
  ['search', { type: 'string', minLength: 1, maxLength: 100 }, 'Literal text search in text columns. Unsupported for Tickets.'],
  ['sort', { type: 'string' }, 'An actual column in this table; defaults to its primary key.'],
  ['order', { type: 'string', enum: ['asc', 'desc'], default: 'asc' }, 'Sort direction.'],
  ['limit', { type: 'integer', minimum: 1, maximum: 1000 }, 'Optional; omitting it returns every row.'],
  ...['genre_id', 'movie_id', 'hall_id', 'session_id', 'customer_id'].map(name => [name, { type: 'integer', minimum: 1, maximum: 2147483647 }, 'Exact foreign-key filter, only when that foreign key exists in this table.']),
  ...['min_rating', 'max_rating'].map(name => [name, { type: 'number', minimum: 0, maximum: 10, multipleOf: 0.1 }, 'Movies only.']),
  ...['min_price', 'max_price'].map(name => [name, { type: 'number', minimum: 0, maximum: 99999999.99, multipleOf: 0.01 }, 'Tables with a price column only.'])
].map(([name, schema, description]) => ({ name, in: 'query', schema, description }));
specification.paths['/api/tables'] = { get: { summary: 'List all seven tables, columns and exact row counts', operationId: 'listTables', responses: {
  200: jsonResponse('Table catalog', { type: 'array', items: { $ref: '#/components/schemas/TableInfo' } }), 500: error, 503: error } } };
specification.paths['/api/tables/{name}'] = { get: { summary: 'Read every row and every column in one table', operationId: 'readTable',
  description: 'Read-only. No default row limit. Search, sorting, supported foreign keys and rating/price ranges are parameterized. Unknown query parameters return 400.',
  parameters: [tableParameter, ...queryParameters], responses: { 200: jsonResponse('Full table or filtered rows', { type: 'array', items: { oneOf: choices } }), 400: error, 404: error, 405: error, 500: error, 503: error } } };
specification.paths['/api/tables/{name}/{id}'] = { get: { summary: 'Read one table row by primary key', operationId: 'readTableRow',
  parameters: [tableParameter, { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1, maximum: 2147483647 } }],
  responses: { 200: jsonResponse('One row', { oneOf: choices }), 400: error, 404: error, 405: error, 500: error, 503: error } } };
specification.info.version = '1.2.0';
fs.writeFileSync(specificationPath, JSON.stringify(specification, null, 2) + '\n');
