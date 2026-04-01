import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth.js";
import { 
  getAlunosBySala, 
  getUserById, 
  createUser,
  updateUser,
  deleteUser,
  getDashboardStats,
  recalcularCotasPorSala,
  getAlunoDashboardStats,
} from "../storage.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Obter o diretório atual corretamente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configurar upload de avatar - usando caminho absoluto
const avatarStorage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    // __dirname = C:\projetos\novo-formatura\organize-plus\server\routes
    // Subir 2 níveis: routes -> server -> organize-plus
    // Depois entrar em uploads/avatars/
    const dir = path.join(__dirname, "../../uploads/avatars/");
    console.log("Diretório de upload:", dir); // Deve mostrar: .../organize-plus/uploads/avatars/
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});

const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato não permitido. Use JPG ou PNG."));
    }
  }
});

// Rota para aluno atualizar seu próprio avatar
router.post("/me/avatar", requireAuth, (req: any, res: any) => {
  uploadAvatar.single("avatar")(req, res, async (err: any) => {
    try {
      if (err) {
        console.error("Erro no upload:", err);
        return res.status(400).json({ message: err.message });
      }

      const userId = req.session.userId;
      const avatarUrl = req.file ? `/uploads/avatars/${req.file.filename}` : null;
      
      console.log("Arquivo recebido:", req.file);
      console.log("Avatar URL:", avatarUrl);
      
      if (!avatarUrl) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }
      
      const alunoAtualizado = await updateUser(userId, { avatarUrl });
      res.json({ avatarUrl, aluno: alunoAtualizado });
    } catch (error) {
      console.error("Erro ao atualizar avatar:", error);
      res.status(500).json({ message: "Erro interno ao atualizar avatar" });
    }
  });
});

// GET /api/alunos - Listar todos os alunos da sala
router.get("/", requireAdmin, async (req: any, res: any) => {
  try {
    const alunos = await getAlunosBySala(req.session.salaId!);
    res.json(alunos);
  } catch (error) {
    console.error("Erro ao buscar alunos:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/alunos/me - Dados do usuário logado
router.get("/me", requireAuth, async (req: any, res: any) => {
  try {
    const user = await getUserById(req.session.userId!);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    const { senhaHash, ...safe } = user as any;
    res.json(safe);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/alunos/me/dashboard - Dashboard completo do aluno
router.get("/me/dashboard", requireAuth, async (req: any, res: any) => {
  try {
    const alunoId = req.session.userId!;
    const salaId = req.session.salaId;
    
    if (!salaId) {
      console.log("[alunos/me/dashboard] salaId não encontrado, retornando dados padrão");
      return res.status(200).json({
        aluno: { nome: "", avatarUrl: null, metaIndividual: 0 },
        pagamentos: { totalPago: 0, totalPendente: 0, percentualPago: 0 },
        rifas: { totalVendido: 0, totalTickets: 0, metaRifas: 0 },
        sala: { metaTotal: 0, totalArrecadado: 0, saldoCaixa: 0, totalAlunos: 0, percentualMeta: 0 },
      });
    }

    const stats = await getAlunoDashboardStats(alunoId, salaId);
    return res.status(200).json(stats);
  } catch (error) {
    console.error("Erro ao buscar dashboard do aluno:", error);
    return res.status(200).json({
      aluno: { nome: "", avatarUrl: null, metaIndividual: 0 },
      pagamentos: { totalPago: 0, totalPendente: 0, percentualPago: 0 },
      rifas: { totalVendido: 0, totalTickets: 0, metaRifas: 0 },
      sala: { metaTotal: 0, totalArrecadado: 0, saldoCaixa: 0, totalAlunos: 0, percentualMeta: 0 },
    });
  }
});

// GET /api/alunos/:id - Buscar aluno por ID
router.get("/:id", requireAdmin, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    
    // Validar se é um número válido
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "ID inválido" });
    }
    
    const aluno = await getUserById(id);
    
    if (!aluno) {
      return res.status(404).json({ message: "Aluno não encontrado" });
    }
    
    if (aluno.salaId !== req.session.salaId) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    
    const { senhaHash, ...safe } = aluno as any;
    res.json(safe);
  } catch (error) {
    console.error("Erro ao buscar aluno:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/alunos/dashboard-stats - Estatísticas do dashboard
router.get("/dashboard-stats", requireAdmin, async (req: any, res: any) => {
  console.log("🔴🔴🔴 ROTA DASHBOARD FOI CHAMADA! 🔴🔴🔴");
  try {
    const stats = await getDashboardStats(req.session.salaId!);
    res.json(stats);
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ message: "Erro interno" });
  }
}); 

// POST /api/alunos - Criar novo aluno
router.post("/", requireAdmin, async (req: any, res: any) => {
  try {
    const { nome, email, senha, celular } = req.body;
    
    if (!nome || !email || !senha) {
      return res.status(400).json({ message: "Nome, email e senha são obrigatórios" });
    }
    
    const aluno = await createUser({ 
      nome, 
      email, 
      senha, 
      celular,
      role: "aluno", 
      salaId: req.session.salaId! 
    });

    // Recalcular cotas individuais após adicionar aluno
    await recalcularCotasPorSala(req.session.salaId!);
    
    const { senhaHash, ...safe } = aluno as any;
    res.status(201).json(safe);
  } catch (e: any) {
    console.error("Erro ao criar aluno:", e);
    res.status(400).json({ message: e.message });
  }
});

// PUT /api/alunos/:id - Atualizar aluno
router.put("/:id", requireAdmin, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const { nome, email, celular } = req.body;
    
    const alunoExistente = await getUserById(id);
    if (!alunoExistente) {
      return res.status(404).json({ message: "Aluno não encontrado" });
    }
    
    if (alunoExistente.salaId !== req.session.salaId) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    
    const alunoAtualizado = await updateUser(id, { nome, email, celular });
    const { senhaHash, ...safe } = alunoAtualizado as any;
    
    res.json(safe);
  } catch (error) {
    console.error("Erro ao atualizar aluno:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// DELETE /api/alunos/:id - Deletar aluno
router.delete("/:id", requireAdmin, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    
    const alunoExistente = await getUserById(id);
    if (!alunoExistente) {
      return res.status(404).json({ message: "Aluno não encontrado" });
    }
    
    if (alunoExistente.salaId !== req.session.salaId) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    
    const salaId = alunoExistente.salaId!;
    await deleteUser(id);
    // Recalcular cotas individuais após remover aluno
    await recalcularCotasPorSala(salaId);
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar aluno:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

export default router;