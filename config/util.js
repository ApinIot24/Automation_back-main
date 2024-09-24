const { Pool } = require('pg');

const pool = new Pool({
  user: 'automation',
  password: 'Auto123',
  host: 'localhost',
  port: 5432, // default Postgres port
  database: 'automation'
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};