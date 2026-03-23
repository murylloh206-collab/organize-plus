import { Router } from "express";
import { createSala, getSalaById, updateUser } from "../storage.js";
import { db } from "../db.js";
import { chaves, salas } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

// GET /api/salas - listar todas as salas
router.get("/", async (req, res) => {
  try {
    const todasSalas = await db.select().from(salas);
    res.json(todasSalas);
  } catch (error) {
    console.error("Erro ao listar salas:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// POST /api/salas - Criar nova sala (somente admin autenticado COM chave válida)
router.post("/", async (req, res) => {
  try {
    if (!req.session?.userId || req.session.userRole !== "admin") {
      return res.status(401).json({ message: "Não autorizado" });
    }

    // Verificar se o admin tem uma chave validada na sessão
    if (!req.session.chaveValidada || !req.session.chaveId) {
      return res.status(403).json({
        message: "É necessária uma chave de acesso válida para criar uma turma",
        requiresChave: true,
      });
    }

    const { nome, codigo, dataFormatura, metaValor, senha } = req.body;

    if (!nome) {
      return res.status(400).json({ message: "Nome da turma é obrigatório" });
    }

    const codigoFinal = codigo || Math.random().toString(36).substring(2, 8).toUpperCase();

    const sala = await createSala({
      nome,
      codigo: codigoFinal,
      dataFormatura: dataFormatura || undefined,
      metaValor: parseFloat(metaValor) || 0,
      senha: senha,
    });

    // Vincular o admin à sala criada
    await updateUser(req.session.userId, { salaId: sala.id });    

    // Atualizar salaId na sessão do admin
    req.session.salaId = sala.id;

    // Limpar da sessão após uso
    req.session.chaveValidada = false;
    req.session.chaveId = undefined;

    res.status(201).json({ sala });
  } catch (e: any) {
    console.error("Erro ao criar sala:", e);
    res.status(500).json({ message: "Erro ao criar sala" });
  }
});

// GET /api/salas/:id
router.get("/:id", async (req, res) => {
  try {
    const sala = await getSalaById(parseInt(req.params.id));
    if (!sala) return res.status(404).json({ message: "Sala não encontrada" });
    res.json({ sala });
  } catch (e: any) {
    res.status(500).json({ message: "Erro ao buscar sala" });
  }
});

export default router;