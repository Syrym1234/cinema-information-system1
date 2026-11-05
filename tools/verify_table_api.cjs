'use strict';
require('dotenv').config();
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { tables } = require('../server/table-query');
const db = require('../server/db');
(async () => {
  try {
    const connection = await db.pool();
    const baseUrl = 'http://127.0.0.1:3000';
    const catalogResponse = await fetch(baseUrl + '/api/tables');
    assert.equal(catalogResponse.status, 200);
    const catalog = await catalogResponse.json(), results = [];
    assert.equal(catalog.length, 7);
    for (const table of tables) {
      const schema = await connection.request().input('name', db.sql.NVarChar(128), table.name).query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME=@name ORDER BY ORDINAL_POSITION");
      assert.deepEqual(table.columns, schema.recordset.map(row => row.COLUMN_NAME));
      const databaseRows = (await connection.request().query(`SELECT * FROM dbo.[${table.name}] ORDER BY [${table.key}]`)).recordset;
      const response = await fetch(baseUrl + '/api/tables/' + table.name);
      assert.equal(response.status, 200);
      const apiRows = await response.json();
      assert.deepEqual(apiRows, JSON.parse(JSON.stringify(databaseRows)));
      assert.equal(catalog.find(item => item.table === table.name).row_count, databaseRows.length);
      const one = await fetch(baseUrl + `/api/tables/${table.name}/${databaseRows[0][table.key]}`);
      assert.equal(one.status, 200);
      assert.deepEqual(await one.json(), apiRows[0]);
      results.push({ table: table.name, rows: apiRows.length, allColumnsMatchSqlSchema: true, allRowsMatchSql: true, readByIdMatchesSql: true });
    }
    fs.writeFileSync('docs/lab10/evidence/all-tables-validation.json', JSON.stringify({ checkedAt: new Date().toISOString(), baseUrl, passed: true, results }, null, 2) + '\n');
    console.log(JSON.stringify(results));
  } finally { await db.closePool(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
