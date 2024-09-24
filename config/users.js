const { Pool } = require('pg');

const pool = new Pool({
  user: 'it_purwosari',
  password: '3dced9c494bf',
  host: '10.2.8.70',
  port: 5432, // default Postgres port
  database: 'iot'
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};