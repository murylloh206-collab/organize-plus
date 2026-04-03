import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";
import { config } from "dotenv";
import dns from "dns";

config();

// Forçar resolução de DNS para IPv4
dns.setDefaultResultOrder("ipv4first");

const rawUrl = process.env.DATABASE_URL;

if (!rawUrl) {
  console.error("❌ DATABASE_URL não configurada!");
  throw new Error("DATABASE_URL não configurada");
}

// Remover quaisquer parâmetros de query (?pgbouncer=true, etc.)
// O Transaction Pooler do Supabase (porta 6543) não aceita esses parâmetros
const connectionString = rawUrl.split("?")[0];

// Log seguro (oculta a senha)
const safeUrl = connectionString.replace(/:[^:@]*@/, ":***@");
console.log("[DB] URL de conexão (segura):", safeUrl);

// Detectar automaticamente o tipo de conexão pela porta
const isPooler = connectionString.includes(":6543/");
console.log(
  `[DB] Modo: ${isPooler ? "Transaction Pooler (6543)" : "Conexão Direta (5432)"}`
);

// ─── Cliente postgres.js para o Drizzle ORM ───────────────────────────────
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  // SSL obrigatório para Supabase (tanto pooler quanto direto)
  ssl: "require",
  // Desabilitar prepared statements ao usar pgBouncer/Pooler em modo transaction
  prepare: false,
});

// ─── Pool pg (node-postgres) para connect-pg-simple (sessões) ─────────────
const pgPool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Supabase usa certificado auto-assinado
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pgPool.on("error", (err) => {
  console.error("[DB Pool] Erro inesperado no pool de conectores:", err.message);
});

pgPool.on("connect", () => {
  console.log("[DB Pool] Nova conexão estabelecida com o PostgreSQL");
});

// Teste de conexão ao iniciar
(async () => {
  try {
    const result = await pgPool.query("SELECT NOW() as now");
    console.log(
      "[DB] ✅ Conexão com o banco estabelecida:",
      result.rows[0].now
    );
  } catch (err: any) {
    console.error("[DB] ❌ Falha ao conectar com o banco:", err.message);
    console.error("[DB] Verifique a DATABASE_URL e as configurações de rede");
  }
})();

export const db = drizzle(client, { schema });
export const pool = pgPool;
export { client };