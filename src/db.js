import dotenv from "dotenv";
import pkg from "pg";
dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}
