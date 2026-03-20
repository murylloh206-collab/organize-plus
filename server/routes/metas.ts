import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth.js";
import { 
  getMetasBySala, 
  getMetaById, 
  createMeta, 
  updateMeta,
  deleteMeta, // <- Verifique se esta linha existe
  getContribuicoesByMeta,
  createContribuicao,
  updateContribuicao,
  deleteContribuicao,
  getHistoricoByMeta 
} from "../storage.js";

const router = Router();

// GET /api/metas - Listar todas as metas da sala
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await getMetasBySala(req.session.salaId!);
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/metas/:id - Buscar meta por ID
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const meta = await getMetaById(id);
    
    if (!meta) {
      return res.status(404).json({ message: "Meta não encontrada" });
    }
    
    if (meta.salaId !== req.session.salaId) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    
    res.json(meta);
  } catch (error) {
    console.error("Erro ao buscar meta:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// POST /api/metas - Criar nova meta
router.post("/", requireAdmin, async (req, res) => {
  try {
    const meta = await createMeta({ 
      ...req.body, 
      salaId: req.session.salaId! 
    });
    res.status(201).json(meta);
  } catch (e: any) {
    console.error("Erro ao criar meta:", e);
    res.status(400).json({ message: e.message });
  }
});

// PATCH /api/metas/:id - Atualizar meta
router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const meta = await updateMeta(parseInt(req.params.id), req.body);
    res.json(meta);
  } catch (e: any) {
    console.error("Erro ao atualizar meta:", e);
    res.status(400).json({ message: e.message });
  }
});

// ✨ DELETE /api/metas/:id - Deletar meta
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const salaId = req.session.salaId;

    // Verificar se a meta existe
    const meta = await getMetaById(id);
    if (!meta) {
      return res.status(404).json({ message: "Meta não encontrada" });
    }

    // Verificar se a meta pertence à sala do usuário
    if (meta.salaId !== salaId) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    await deleteMeta(id);
    res.status(204).send();
  } catch (e: any) {
    console.error("Erro ao deletar meta:", e);
    res.status(400).json({ message: e.message });
  }
});

// GET /api/metas/:id/contribuicoes - Listar contribuições de uma meta
router.get("/:id/contribuicoes", requireAuth, async (req, res) => {
  try {
    const metaId = parseInt(req.params.id);
    
    const meta = await getMetaById(metaId);
    if (!meta) {
      return res.status(404).json({ message: "Meta não encontrada" });
    }
    
    if (meta.salaId !== req.session.salaId) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    
    const contribuicoes = await getContribuicoesByMeta(metaId);
    res.json(contribuicoes);
  } catch (error) {
    console.error("Erro ao buscar contribuições:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// POST /api/metas/:id/contribuicoes - Adicionar contribuição
router.post("/:id/contribuicoes", requireAdmin, async (req, res) => {
  try {
    const metaId = parseInt(req.params.id);
    const { alunoId, valor, descricao } = req.body;
    const adminId = req.session.userId!;
    
    if (!alunoId || !valor) {
      return res.status(400).json({ message: "Aluno e valor são obrigatórios" });
    }
    
    const contribuicao = await createContribuicao({
      metaId,
      alunoId,
      valor: valor.toString(),
      descricao,
      createdBy: adminId
    });
    
    res.status(201).json(contribuicao);
  } catch (e: any) {
    console.error("Erro ao criar contribuição:", e);
    res.status(400).json({ message: e.message });
  }
});

// PATCH /api/metas/contribuicoes/:id - Atualizar contribuição
router.patch("/contribuicoes/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { alunoId, valor, descricao } = req.body;
    
    const contribuicao = await updateContribuicao(id, {
      alunoId,
      valor: valor?.toString(),
      descricao
    });
    
    res.json(contribuicao);
  } catch (e: any) {
    console.error("Erro ao atualizar contribuição:", e);
    res.status(400).json({ message: e.message });
  }
});

// DELETE /api/metas/contribuicoes/:id - Deletar contribuição
router.delete("/contribuicoes/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await deleteContribuicao(id);
    res.status(204).send();
  } catch (e: any) {
    console.error("Erro ao deletar contribuição:", e);
    res.status(400).json({ message: e.message });
  }
});

// GET /api/metas/:id/historico - Listar histórico da meta
router.get("/:id/historico", requireAuth, async (req, res) => {
  try {
    const metaId = parseInt(req.params.id);
    
    const meta = await getMetaById(metaId);
    if (!meta) {
      return res.status(404).json({ message: "Meta não encontrada" });
    }
    
    if (meta.salaId !== req.session.salaId) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    
    const historico = await getHistoricoByMeta(metaId);
    res.json(historico);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

export default router;