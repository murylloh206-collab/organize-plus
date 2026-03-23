import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth.js";
import { getAlunosBySala, getUserById, createUser, updateUser, deleteUser, getDashboardStats } from "../storage.js";
const router = Router();
// GET /api/alunos - Listar todos os alunos da sala
router.get("/", requireAdmin, async (req, res) => {
    try {
        const alunos = await getAlunosBySala(req.session.salaId);
        // Remover campos sensíveis (senhaHash não existe mais no tipo retornado)
        res.json(alunos);
    }
    catch (error) {
        console.error("Erro ao buscar alunos:", error);
        res.status(500).json({ message: "Erro interno" });
    }
});
// GET /api/alunos/me - Dados do usuário logado
router.get("/me", requireAuth, async (req, res) => {
    try {
        const user = await getUserById(req.session.userId);
        if (!user)
            return res.status(404).json({ message: "Usuário não encontrado" });
        // Remover campos sensíveis se existirem
        const { senhaHash, ...safe } = user;
        res.json(safe);
    }
    catch (error) {
        console.error("Erro ao buscar usuário:", error);
        res.status(500).json({ message: "Erro interno" });
    }
});
// GET /api/alunos/:id - Buscar aluno por ID
router.get("/:id", requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const aluno = await getUserById(id);
        if (!aluno) {
            return res.status(404).json({ message: "Aluno não encontrado" });
        }
        // Verificar se o aluno pertence à sala do admin
        if (aluno.salaId !== req.session.salaId) {
            return res.status(403).json({ message: "Acesso negado" });
        }
        const { senhaHash, ...safe } = aluno;
        res.json(safe);
    }
    catch (error) {
        console.error("Erro ao buscar aluno:", error);
        res.status(500).json({ message: "Erro interno" });
    }
});
// GET /api/alunos/dashboard-stats - Estatísticas do dashboard
router.get("/dashboard-stats", requireAdmin, async (req, res) => {
    try {
        const stats = await getDashboardStats(req.session.salaId);
        res.json(stats);
    }
    catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
        res.status(500).json({ message: "Erro interno" });
    }
});
// POST /api/alunos - Criar novo aluno
router.post("/", requireAdmin, async (req, res) => {
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
            salaId: req.session.salaId
        });
        const { senhaHash, ...safe } = aluno;
        res.status(201).json(safe);
    }
    catch (e) {
        console.error("Erro ao criar aluno:", e);
        res.status(400).json({ message: e.message });
    }
});
// PUT /api/alunos/:id - Atualizar aluno
router.put("/:id", requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { nome, email, celular } = req.body;
        // Verificar se o aluno existe
        const alunoExistente = await getUserById(id);
        if (!alunoExistente) {
            return res.status(404).json({ message: "Aluno não encontrado" });
        }
        // Verificar se o aluno pertence à sala do admin
        if (alunoExistente.salaId !== req.session.salaId) {
            return res.status(403).json({ message: "Acesso negado" });
        }
        const alunoAtualizado = await updateUser(id, { nome, email, celular });
        const { senhaHash, ...safe } = alunoAtualizado;
        res.json(safe);
    }
    catch (error) {
        console.error("Erro ao atualizar aluno:", error);
        res.status(500).json({ message: "Erro interno" });
    }
});
// DELETE /api/alunos/:id - Deletar aluno
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        // Verificar se o aluno existe
        const alunoExistente = await getUserById(id);
        if (!alunoExistente) {
            return res.status(404).json({ message: "Aluno não encontrado" });
        }
        // Verificar se o aluno pertence à sala do admin
        if (alunoExistente.salaId !== req.session.salaId) {
            return res.status(403).json({ message: "Acesso negado" });
        }
        await deleteUser(id);
        res.status(204).send();
    }
    catch (error) {
        console.error("Erro ao deletar aluno:", error);
        res.status(500).json({ message: "Erro interno" });
    }
});
export default router;
