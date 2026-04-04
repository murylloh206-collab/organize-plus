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

// ============================================
// CORS - Configuração correta para produção
// ============================================
app.use(cors({
  origin: function (origin, callback) {
    // Permite qualquer origem dinamicamente (Vercel, localhost, etc)
    callback(null, origin || true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie', 'X-Requested-With'],
}));

// ============================================
// Middlewares básicos
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// Middleware para garantir credenciais
// ============================================
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// ============================================
// Logging de requisições
// ============================================
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 500 ? "\x1b[31m" : res.statusCode >= 400 ? "\x1b[33m" : "\x1b[32m";
    console.log(`[HTTP] ${statusColor}${res.statusCode}\x1b[0m ${req.method} ${req.originalUrl} — ${duration}ms`);
  });
  next();
});

// ============================================
// Arquivos estáticos
// ============================================
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ============================================
// SESSÃO - Configuração correta para Render
// ============================================
const isProduction = process.env.NODE_ENV === "production";
app.set("trust proxy", 1); // Importante para proxies HTTPS como Render

const MemoryStore = MemoryStoreFactory(session);
app.use(session({
  store: new MemoryStore({ checkPeriod: 86400000 }),
  secret: process.env.SESSION_SECRET || 'organize_plus_secret',
  resave: false,
  saveUninitialized: false, // Melhor para não criar sessões vazias à toa
  cookie: {
    secure: isProduction, // IMPORTANTE: true em produção para cookies Cross-Site
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    sameSite: isProduction ? 'none' : 'lax', // 'none' para Cross-Site (Vercel -> Render)
  }
}));

// ============================================
// ROTAS DA API
// ============================================
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

// ============================================
// HEALTH CHECK E DEBUG
// ============================================
app.get("/api/health", (_, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.get("/api/debug/session", (req, res) => {
  res.json({
    sessionId: req.sessionID,
    userId: req.session?.userId,
    userRole: req.session?.userRole,
    salaId: req.session?.salaId,
    hasSession: !!req.session,
    cookies: req.headers.cookie || "nenhum cookie"
  });
});

app.get("/api/debug", (req, res) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// SERVER FRONTEND (produção)
// ============================================
if (process.env.NODE_ENV === "production") {
  const staticPath = path.join(__dirname, "../client/dist");
  
  // IMPORTANTE: Servir arquivos estáticos PRIMEIRO
  app.use(express.static(staticPath));
  
  // Depois, fallback para React Router (APENAS para rotas que não são arquivos)
  app.get("*", (req, res) => {
    // Se a requisição for para um arquivo com extensão, não fazer fallback
    if (req.path.match(/\.(js|css|png|jpg|jpeg|svg|ico|json|webmanifest)$/)) {
      return res.status(404).send("Arquivo não encontrado");
    }
    res.sendFile(path.join(staticPath, "index.html"));
  });
  
  console.log(`📁 Servindo React App de: ${staticPath}`);
}
// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`\n🚀 Organize+ API rodando em http://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || "development"}\n`);
});