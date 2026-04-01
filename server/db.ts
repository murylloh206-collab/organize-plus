import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";
import { config } from "dotenv";

config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL não configurada!");
  throw new Error("DATABASE_URL não configurada");
}

console.log("[DB] Conectando ao banco...");
// Log seguro (esconde a senha)
const safeUrl = connectionString.replace(/:[^:]*@/, ":***@");
console.log("[DB] URL:", safeUrl);

// Cliente para drizzle (postgres)
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  ssl: { rejectUnauthorized: false },
});

// Pool para sessions (pg)
const pgPool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

export const db = drizzle(client, { schema });
export { pgPool as pool };
export { client };