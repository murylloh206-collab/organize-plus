import express from "express";
import session from "express-session";
import MemoryStoreFactory from "memorystore";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

import authRoutes from "./routes/auth.js";
import alunosRoutes from "./routes/alunos.js";
import rifasRoutes from "./routes/rifas.js";
import pagamentosRoutes from "./routes/pagamentos.js";
import eventosRoutes from "./routes/eventos.js";
import metasRoutes from "./routes/metas.js";
import caixaRoutes from "./routes/caixa.js";
import salasRoutes from "./routes/salas.js";
import googleCalendarRoutes from "./routes/googleCalendar.js";
import uploadRoutes from "./routes/upload.js";
import rankingRoutes from "./routes/ranking.js";
import notificacoesRoutes from "./routes/notificacoes.js";
import dashboardRouter from "./routes/dashboard.js";

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || "5000");

// Middlewares
const corsOptions = {
  origin: process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || "https://organize-plus.onrender.com"
      : ["http://localhost:5173", "http://localhost:5174", "http://192.168.1.40:5173"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging de requisições
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 500 ? "\x1b[31m" : res.statusCode >= 400 ? "\x1b[33m" : "\x1b[32m";
    console.log(`[HTTP] ${statusColor}${res.statusCode}\x1b[0m ${req.method} ${req.originalUrl} — ${duration}ms`);
  });
  next();
});

// Arquivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Configuração de sessão (MemoryStore para Serverless)
const MemoryStore = MemoryStoreFactory(session);
app.use(session({
  store: new MemoryStore({ checkPeriod: 86400000 }),  // ← CORRIGIDO: usar MemoryStore, não MemoryStoreSession
  secret: process.env.SESSION_SECRET || 'organize_plus_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  }
}));

// Rotas
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
app.get("/api/health", (_, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Debug REST api
app.get("/api/debug/session", (req, res) => {
  res.json({
    userId: req.session?.userId,
    userRole: req.session?.userRole,
    salaId: req.session?.salaId,
    hasSession: !!req.session,
  });
});

app.get("/api/debug", (req, res) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Servir frontend no modo produção
if (process.env.NODE_ENV === "production") {
  const staticPath = path.join(__dirname, "../client/dist");
  app.use(express.static(staticPath));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
  console.log(`📁 Servindo React App de: ${staticPath}`);
}

app.listen(PORT, () => {
  console.log(`\n🚀 Organize+ API rodando em http://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || "development"}\n`);
});