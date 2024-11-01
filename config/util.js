import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  user: 'automation',
  password: 'Auto123',
  host: 'localhost',
  port: 5432,
  database: 'automation'
});

const db = {
  query: (text, params) => pool.query(text, params)
};

export default db;
