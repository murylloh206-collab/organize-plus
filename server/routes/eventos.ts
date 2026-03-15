import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth.js";
import { getEventosBySala, createEvento, updateEvento, deleteEvento } from "../storage.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const salaId = req.session.salaId!;
  const result = await getEventosBySala(salaId);
  res.json(result);
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const ev = await createEvento({ ...req.body, salaId: req.session.salaId! });
    res.json(ev);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const ev = await updateEvento(parseInt(req.params.id), req.body);
  res.json(ev);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await deleteEvento(parseInt(req.params.id));
  res.json({ ok: true });
});

export default router;
