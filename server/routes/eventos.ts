import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth.js";
import { 
  getEventosBySala, 
  getEventosProximos, // Nova função
  createEvento, 
  updateEvento, 
  deleteEvento 
} from "../storage.js";

const router = Router();

// GET /api/eventos - Listar todos os eventos da sala
router.get("/", requireAuth, async (req, res) => {
  try {
    const salaId = req.session.salaId!;
    const result = await getEventosBySala(salaId);
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/eventos/proximos - Listar próximos eventos
router.get("/proximos", requireAuth, async (req, res) => {
  try {
    const salaId = req.session.salaId!;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await getEventosProximos(salaId, limit);
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar próximos eventos:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// POST /api/eventos - Criar novo evento
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { titulo, descricao, data, local, tipo, status } = req.body;
    
    if (!titulo || !data) {
      return res.status(400).json({ message: "Título e data são obrigatórios" });
    }

    const eventoData = {
      titulo,
      descricao: descricao || null,
      data: new Date(data),
      local: local || null,
      tipo: tipo || "evento",
      status: status || "planejado",
      salaId: req.session.salaId!
    };

    const ev = await createEvento(eventoData);
    res.status(201).json(ev);
  } catch (e: any) {
    console.error("Erro ao criar evento:", e);
    res.status(400).json({ message: e.message });
  }
});

// PUT /api/eventos/:id - Atualizar evento completo
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { titulo, descricao, data, local, tipo, status } = req.body;
    
    const eventoData: any = {};
    
    if (titulo !== undefined) eventoData.titulo = titulo;
    if (descricao !== undefined) eventoData.descricao = descricao;
    if (data !== undefined) eventoData.data = new Date(data);
    if (local !== undefined) eventoData.local = local;
    if (tipo !== undefined) eventoData.tipo = tipo;
    if (status !== undefined) {
      if (status === "planejado" || status === "realizado" || status === "cancelado") {
        eventoData.status = status;
      }
    }

    const ev = await updateEvento(id, eventoData);
    res.json(ev);
  } catch (e: any) {
    console.error("Erro ao atualizar evento:", e);
    res.status(400).json({ message: e.message });
  }
});

// PATCH /api/eventos/:id - Atualizar parcialmente
router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const ev = await updateEvento(parseInt(req.params.id), req.body);
    res.json(ev);
  } catch (e: any) {
    console.error("Erro ao atualizar evento:", e);
    res.status(400).json({ message: e.message });
  }
});

// DELETE /api/eventos/:id - Deletar evento
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await deleteEvento(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar evento:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

export default router;