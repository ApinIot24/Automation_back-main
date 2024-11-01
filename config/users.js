// config/util.js
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  user: 'it_purwosari',
  password: '3dced9c494bf',
  host: '10.2.8.70',
  port: 5432,
  database: 'iot'
});

const db = {
  query: (text, params) => pool.query(text, params)
};

export default db;
