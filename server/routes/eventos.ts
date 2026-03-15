import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth.js";
import { getEventosBySala, createEvento, updateEvento, deleteEvento } from "../storage.js";

const router = Router();

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

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { titulo, descricao, data, local, tipo, status } = req.body;
    
    if (!titulo || !data) {
      return res.status(400).json({ message: "Título e data são obrigatórios" });
    }

    // Validar status
    const statusValido = status === "planejado" || status === "realizado" || status === "cancelado" 
      ? status 
      : "planejado";

    const eventoData = {
      titulo,
      descricao: descricao || null,
      data: new Date(data),
      local: local || null,
      tipo: tipo || "evento",
      status: statusValido as "planejado" | "realizado" | "cancelado",
      salaId: req.session.salaId!
    };

    const ev = await createEvento(eventoData);
    res.status(201).json(ev);
  } catch (e: any) {
    console.error("Erro ao criar evento:", e);
    res.status(400).json({ message: e.message });
  }
});

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
      // Validar status
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

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const ev = await updateEvento(parseInt(req.params.id), req.body);
    res.json(ev);
  } catch (e: any) {
    console.error("Erro ao atualizar evento:", e);
    res.status(400).json({ message: e.message });
  }
});

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