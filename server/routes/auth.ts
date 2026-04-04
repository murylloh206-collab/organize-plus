import { Router } from "express";
import { loginSchema, registerSchema } from "../../shared/schema.js";
import {
  getUserByEmail, createUser, getSalaById, createSala,
  getChaveByCode, marcarChaveUsada,
} from "../storage.js";
import { verificarSenha, validarChave, carregarUsuarioSessao } from "../auth.js";

const router = Router();

// GET /api/auth/me
router.get("/me", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ message: "Não autenticado" });
  
  await carregarUsuarioSessao(req, req.session.userId);
  
  res.json({ 
    userId: req.session.userId, 
    role: req.session.userRole, 
    salaId: req.session.salaId 
  });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    console.log("[LOGIN] Tentativa para email:", email);
    
    const user = await getUserByEmail(email);
    if (!user) {
      console.log("[LOGIN] Usuário não encontrado");
      return res.status(401).json({ message: "Credenciais inválidas" });
    }
    
    console.log("[LOGIN] Usuário encontrado, verificando senha...");
    
    // CORREÇÃO: usar senha_hash em vez de senhaHash
    const senhaValida = await verificarSenha(senha, user.senha_hash);
    if (!senhaValida) {
      console.log("[LOGIN] Senha inválida");
      return res.status(401).json({ message: "Credenciais inválidas" });
    }
    
    console.log("[LOGIN] Login bem-sucedido!");
    
    await carregarUsuarioSessao(req, user.id);
    
    // CORREÇÃO: remover senha_hash do objeto retornado
    const { senha_hash: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error("[LOGIN] Erro:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await getUserByEmail(data.email);
    if (existing) return res.status(400).json({ message: "Email já cadastrado" });

    const chaveResult = await validarChave(data.chave);
    if (!chaveResult.valida) return res.status(400).json({ message: chaveResult.motivo });
    const chaveRegistro = chaveResult.registro!;

    let salaId = data.salaId;
    if (!salaId && data.nomeSala) {
      const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
      const sala = await createSala({
        nome: data.nomeSala,
        codigo,
        dataFormatura: data.dataFormatura,
        metaValor: data.metaValor,
      });
      salaId = sala.id;
    }

    const user = await createUser({
      nome: data.nome, email: data.email, senha: data.senha,
      role: "admin", salaId,
    });

    await marcarChaveUsada(chaveRegistro.id, user.id);
    await carregarUsuarioSessao(req, user.id);

    const { senha_hash: _, ...userSafe } = user;
    res.json({ user: userSafe, tipo: "premium" });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// POST /api/auth/register-comissao
router.post("/register-comissao", async (req, res) => {
  try {
    const { nome, email, senha, celular } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ message: "Nome, email e senha são obrigatórios" });
    }

    const existing = await getUserByEmail(email);
    if (existing) return res.status(400).json({ message: "Email já cadastrado" });

    const user = await createUser({ nome, email, senha, role: "admin", salaId: undefined });
    await carregarUsuarioSessao(req, user.id);

    const { senha_hash: _, ...userSafe } = user;
    res.status(201).json({ user: userSafe });
  } catch (e: any) {
    console.error("Erro no registro da comissão:", e);
    res.status(500).json({ message: "Erro interno ao registrar comissão" });
  }
});

// POST /api/auth/register-aluno
router.post("/register-aluno", async (req, res) => {
  try {
    const { nome, email, senha, celular, turmaId, senhaTurma } = req.body;
    
    // ... validações existentes ...
    
    // Criar o usuário
    const user = await createUser({
      nome, email, senha, celular,
      role: "aluno",
      salaId: parseInt(turmaId)
    });
    
    // 🔧 IMPORTANTE: Carregar o usuário na sessão (fazer login automático)
    await carregarUsuarioSessao(req, user.id);
    
    const { senha_hash: _, ...userSafe } = user;
    res.status(201).json({ user: userSafe });
  } catch (e: any) {
    console.error("Erro no registro de aluno:", e);
    res.status(500).json({ message: "Erro interno no registro de aluno" });
  }
});

// POST /api/auth/validate-chave
router.post("/validate-chave", async (req, res) => {
  const { chave } = req.body;
  if (!chave) return res.status(400).json({ message: "Chave obrigatória" });
  const result = await validarChave(chave);
  if (!result.valida) return res.status(400).json({ message: result.motivo });

  req.session.chaveValidada = true;
  if (result.registro) {
    req.session.chaveId = result.registro.id;
  }

  res.json({ valida: true, tipo: "premium" });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

export default router;