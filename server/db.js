'use strict';
require('dotenv').config();

// SQL authentication is portable; Windows authentication uses the optional native driver.
const windowsAuth = process.env.DB_AUTH === 'windows';
const sql = windowsAuth ? require('mssql/msnodesqlv8') : require('mssql');
const options = {
  encrypt: process.env.DB_ENCRYPT === 'true',
  trustServerCertificate: process.env.DB_TRUST_CERT !== 'false',
  ...(windowsAuth ? { trustedConnection: true } : {})
};
const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'CinemaSchoolDB',
  options,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 10000,
  requestTimeout: 15000,
  ...(windowsAuth ? {} : { user: process.env.DB_USER || 'sa', password: process.env.DB_PASSWORD || '' })
};
if (process.env.DB_PORT) config.port = Number(process.env.DB_PORT);
if (windowsAuth) {
  const odbc = value => `{${String(value).replace(/}/g, '}}')}}`;
  const server = config.server + (config.port ? `,${config.port}` : '');
  config.connectionString = `Driver=${odbc(process.env.DB_ODBC_DRIVER || 'ODBC Driver 17 for SQL Server')};Server=${odbc(server)};Database=${odbc(config.database)};Trusted_Connection=Yes;Encrypt=${options.encrypt ? 'Yes' : 'No'};TrustServerCertificate=${options.trustServerCertificate ? 'Yes' : 'No'};`;
}
let poolPromise;
function pool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect().then(connection => {
      connection.on('error', err => console.error('SQL pool:', err.code || 'DATABASE_ERROR'));
      return connection;
    }).catch(err => { poolPromise = null; throw err; });
  }
  return poolPromise;
}
async function closePool() {
  if (poolPromise) {
    const pending = poolPromise;
    poolPromise = null;
    const connection = await pending.catch(() => null);
    if (connection) await connection.close();
  }
}
module.exports = { sql, pool, closePool };
