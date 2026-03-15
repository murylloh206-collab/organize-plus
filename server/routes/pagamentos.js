import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth.js";
import { getPagamentosBySala, getPagamentosByUsuario, createPagamento, updatePagamento } from "../storage.js";
const router = Router();
// GET /api/pagamentos
router.get("/", requireAuth, async (req, res) => {
    const salaId = req.session.salaId;
    if (req.session.userRole === "admin") {
        const result = await getPagamentosBySala(salaId);
        return res.json(result);
    }
    const result = await getPagamentosByUsuario(req.session.userId);
    res.json(result);
});
// POST /api/pagamentos
router.post("/", requireAdmin, async (req, res) => {
    try {
        const pag = await createPagamento({ ...req.body, salaId: req.session.salaId });
        res.json(pag);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
// PATCH /api/pagamentos/:id
router.patch("/:id", requireAdmin, async (req, res) => {
    const pag = await updatePagamento(parseInt(req.params.id), req.body);
    res.json(pag);
});
export default router;
