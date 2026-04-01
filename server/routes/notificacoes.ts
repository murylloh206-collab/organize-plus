import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth.js";
import {
  getNotificacoesByAluno,
  getNotificacaoCountNaoLidas,
  createNotificacao,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
} from "../storage.js";

const router = Router();

// GET /api/notificacoes - Listar notificações do aluno logado
router.get("/", requireAuth, async (req: any, res: any) => {
  try {
    const alunoId = req.session.userId!;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const notificacoes = await getNotificacoesByAluno(alunoId, limit);
    res.json(notificacoes);
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/notificacoes/nao-lidas - Contagem de não lidas
router.get("/nao-lidas", requireAuth, async (req: any, res: any) => {
  try {
    const alunoId = req.session.userId!;
    const count = await getNotificacaoCountNaoLidas(alunoId);
    res.json({ count });
  } catch (error) {
    console.error("Erro ao contar notificações:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// PUT /api/notificacoes/marcar-todas-lidas - Marcar todas como lidas
router.put("/marcar-todas-lidas", requireAuth, async (req: any, res: any) => {
  try {
    const alunoId = req.session.userId!;
    await marcarTodasNotificacoesComoLidas(alunoId);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao marcar notificações:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// PUT /api/notificacoes/:id/lida - Marcar uma notificação como lida
router.put("/:id/lida", requireAuth, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const notificacao = await marcarNotificacaoComoLida(id);
    res.json(notificacao);
  } catch (error) {
    console.error("Erro ao marcar notificação:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// POST /api/notificacoes - Criar notificação (admin)
router.post("/", requireAdmin, async (req: any, res: any) => {
  try {
    const { alunoId, titulo, mensagem, tipo } = req.body;

    if (!alunoId || !titulo || !mensagem) {
      return res.status(400).json({ message: "alunoId, titulo e mensagem são obrigatórios" });
    }

    const notificacao = await createNotificacao({
      alunoId: parseInt(alunoId),
      titulo,
      mensagem,
      tipo: tipo || "sistema",
    });

    res.status(201).json(notificacao);
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

export default router;
