import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth.js";
import { getCaixaBySala, createMovimento, getSaldoCaixa } from "../storage.js";
const router = Router();
router.get("/", requireAuth, async (req, res) => {
    const result = await getCaixaBySala(req.session.salaId);
    res.json(result);
});
router.get("/saldo", requireAuth, async (req, res) => {
    const saldo = await getSaldoCaixa(req.session.salaId);
    res.json({ saldo });
});
router.post("/", requireAdmin, async (req, res) => {
    try {
        const mov = await createMovimento({
            ...req.body,
            salaId: req.session.salaId,
            createdBy: req.session.userId,
        });
        res.json(mov);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
export default router;
