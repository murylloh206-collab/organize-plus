import express from "express";
import session from "express-session";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { pool, db } from "./db.js";
import connectPgSimple from "connect-pg-simple";
import dashboardRouter from "./routes/dashboard.js";

import authRoutes from "./routes/auth.js";
import alunosRoutes from "./routes/alunos.js";
import rifasRoutes from "./routes/rifas.js";
import pagamentosRoutes from "./routes/pagamentos.js";
import eventosRoutes from "./routes/eventos.js";
import metasRoutes from "./routes/metas.js";
import caixaRoutes from "./routes/caixa.js";
import salasRoutes from "./routes/salas.js";
import googleCalendarRoutes from "./routes/googleCalendar.js";
import "express-session";
import uploadRoutes from "./routes/upload.js";
import rankingRoutes from "./routes/ranking.js";
import notificacoesRoutes from "./routes/notificacoes.js";

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || "5000");

const PgSession = connectPgSimple(session);

// ----- Middlewares -----
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || "https://organize-plus.onrender.com"
      : [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://192.168.1.40:5173",
        ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Middleware de logging de requisições ──────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusColor =
      res.statusCode >= 500
        ? "\x1b[31m" // vermelho
        : res.statusCode >= 400
        ? "\x1b[33m" // amarelo
        : "\x1b[32m"; // verde
    console.log(
      `[HTTP] ${statusColor}${res.statusCode}\x1b[0m ${req.method} ${req.originalUrl} — ${duration}ms`
    );
  });
  next();
});

// Servir arquivos estáticos da pasta uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ─── Configuração da sessão com connect-pg-simple ─────────────────────────
app.use(
  session({
    store: new PgSession({
      pool: pool, // pool pg importado do db.ts
      tableName: "user_sessions",
      createTableIfMissing: true, // cria a tabela automaticamente se não existir
    }),
    secret: process.env.SESSION_SECRET || "organizze_plus_secret_fallback",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    },
  })
);

// ----- Rotas -----
app.use("/api/auth", authRoutes);
app.use("/api/alunos", alunosRoutes);
app.use("/api/rifas", rifasRoutes);
app.use("/api/pagamentos", pagamentosRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/metas", metasRoutes);
app.use("/api/caixa", caixaRoutes);
app.use("/api/salas", salasRoutes);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/google-calendar", googleCalendarRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/ranking", rankingRoutes);
app.use("/api/notificacoes", notificacoesRoutes);

// Health check
app.get("/api/health", (_, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// Rota de debug — verifica conexão com banco
app.get("/api/debug/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now, 1 as test");
    res.json({
      status: "ok",
      dbConnected: true,
      serverTime: result.rows[0].now,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[DEBUG DB] Erro ao conectar:", error.message);
    res.status(500).json({
      status: "error",
      dbConnected: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Rota de debug — verifica sessão atual
app.get("/api/debug/session", (req, res) => {
  res.json({
    userId: req.session?.userId,
    userRole: req.session?.userRole,
    salaId: req.session?.salaId,
    chaveValidada: req.session?.chaveValidada,
    hasSession: !!req.session,
  });
});

// Rota de debug geral
app.get("/api/debug", (req, res) => {
  res.json({
    status: "ok",
    session: {
      userId: req.session?.userId,
      userRole: req.session?.userRole,
      salaId: req.session?.salaId,
    },
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Servir arquivos estáticos em produção (React SPA) ────────────────────
if (process.env.NODE_ENV === "production") {
  const staticPath = path.join(__dirname, "../client/dist");

  app.use(express.static(staticPath));

  // Catch-all para React Router (deve ficar APÓS todas as rotas de API)
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  console.log(`📁 Servindo arquivos estáticos de: ${staticPath}`);
}

app.listen(PORT, () => {
  console.log(`\n🚀 Organizze+ API rodando em http://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || "development"}\n`);
});