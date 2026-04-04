import express from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import cors from "cors";
import { config } from "dotenv";
import type { VercelRequest, VercelResponse } from '@vercel/node';

config();

const app = express();

const MemoryStore = createMemoryStore(session);

// Middlewares
app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? "https://organize-plus.vercel.app"
    : "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessão (usando MemoryStore configurado para Vercel)
app.use(session({
  secret: process.env.SESSION_SECRET || 'organize_plus_backend_secret',
  resave: false,
  saveUninitialized: true,
  store: new MemoryStore({
    checkPeriod: 86400000 // limpa entradas expiradas a cada 24h (otimização para evitar memory leak)
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax', // Ajuste para funcionar mesmo em cross-site se necessário
  }
}));

// Importar rotas
import authRoutes from "../server/routes/auth.js";
import alunosRoutes from "../server/routes/alunos.js";
import rifasRoutes from "../server/routes/rifas.js";
import pagamentosRoutes from "../server/routes/pagamentos.js";
import eventosRoutes from "../server/routes/eventos.js";
import metasRoutes from "../server/routes/metas.js";
import caixaRoutes from "../server/routes/caixa.js";
import salasRoutes from "../server/routes/salas.js";
import rankingRoutes from "../server/routes/ranking.js";
import notificacoesRoutes from "../server/routes/notificacoes.js";
import dashboardRouter from "../server/routes/dashboard.js";

// Usar rotas
app.use("/api/auth", authRoutes);
app.use("/api/alunos", alunosRoutes);
app.use("/api/rifas", rifasRoutes);
app.use("/api/pagamentos", pagamentosRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/metas", metasRoutes);
app.use("/api/caixa", caixaRoutes);
app.use("/api/salas", salasRoutes);
app.use("/api/ranking", rankingRoutes);
app.use("/api/notificacoes", notificacoesRoutes);
app.use("/api/dashboard", dashboardRouter);

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Exportar para Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await new Promise((resolve, reject) => {
    app(req as any, res as any, (err: any) => {
      if (err) reject(err);
      else resolve(null);
    });
  });
}