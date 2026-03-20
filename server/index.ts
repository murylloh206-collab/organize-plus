import express from "express";
import session from "express-session";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { pool } from "./db.js";
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

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || "5000");

const PgSession = connectPgSimple(session);

// ----- Middlewares -----
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://seudominio.com'
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: new PgSession({
    pool,
    tableName: "user_sessions",
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || "organizze_plus_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  },
}));

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


// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Servir arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../client/dist');
  
  app.use(express.static(staticPath));
  
  // Rota catch-all para SPA (React Router)
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
  
  console.log(`📁 Servindo arquivos estáticos de: ${staticPath}`);
}

app.listen(PORT, () => {
  console.log(`\n🚀 Organizze+ API rodando em http://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || "development"}\n`);
});
