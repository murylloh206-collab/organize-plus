import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth.js";
import { getMetasBySala, createMeta, updateMeta } from "../storage.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const result = await getMetasBySala(req.session.salaId!);
  res.json(result);
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const meta = await createMeta({ ...req.body, salaId: req.session.salaId! });
    res.json(meta);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const meta = await updateMeta(parseInt(req.params.id), req.body);
  res.json(meta);
});

export default router;
