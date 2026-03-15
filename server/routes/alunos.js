import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth.js";
import { getAlunosBySala, getUserById, createUser } from "../storage.js";
import { getDashboardStats } from "../storage.js";
const router = Router();
// GET /api/alunos
router.get("/", requireAdmin, async (req, res) => {
    const alunos = await getAlunosBySala(req.session.salaId);
    res.json(alunos.map(u => { const { senhaHash: _, ...safe } = u; return safe; }));
});
// GET /api/alunos/me
router.get("/me", requireAuth, async (req, res) => {
    const user = await getUserById(req.session.userId);
    if (!user)
        return res.status(404).json({ message: "Usuário não encontrado" });
    const { senhaHash: _, ...safe } = user;
    res.json(safe);
});
// GET /api/alunos/dashboard-stats
router.get("/dashboard-stats", requireAdmin, async (req, res) => {
    const stats = await getDashboardStats(req.session.salaId);
    res.json(stats);
});
// POST /api/alunos
router.post("/", requireAdmin, async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        const aluno = await createUser({ nome, email, senha, role: "aluno", salaId: req.session.salaId });
        const { senhaHash: _, ...safe } = aluno;
        res.json(safe);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
export default router;
