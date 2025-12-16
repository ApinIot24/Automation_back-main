import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  user: "automation",
  password: "Auto123",
  host: "10.37.12.17",
  port: 5432,
  database: "automation",
});

const db = {
  connect: () => pool.connect(),
  query: (text, params) => pool.query(text, params),
};

export default db;
