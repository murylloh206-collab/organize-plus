import { Router } from "express";
import { createSala, getSalaById, updateUser, updateSala, deleteSala } from "../storage.js";
import { db } from "../db.js";
import { chaves, salas } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

// GET /api/salas - listar todas as salas (sempre retorna array)
router.get("/", async (req, res) => {
  try {
    console.log("[GET /salas] Buscando todas as salas...");
    const todasSalas = await db.select().from(salas);
    console.log(`[GET /salas] Encontradas ${todasSalas.length} salas`);
    res.json(todasSalas);
  } catch (error) {
    // IMPORTANTE: retornar array vazio para não quebrar o .map() no frontend
    console.error("[GET /salas] Erro ao buscar salas:", error);
    res.json([]); // nunca retornar objeto de erro aqui
  }
});

// POST /api/salas - Criar nova sala
router.post("/", async (req, res) => {
  try {
    console.log("[POST /salas] Body recebido:", req.body);
    
    if (!req.session?.userId || req.session.userRole !== "admin") {
      console.log("[POST /salas] Não autorizado");
      return res.status(401).json({ message: "Não autorizado" });
    }

    // Verificar se o admin tem uma chave validada na sessão
    if (!req.session.chaveValidada || !req.session.chaveId) {
      console.log("[POST /salas] Chave não validada");
      return res.status(403).json({
        message: "É necessária uma chave de acesso válida para criar uma turma",
        requiresChave: true,
      });
    }

    const { nome, escola, ano, metaValor, senha, codigo, dataFormatura, chaveUsada } = req.body;

    if (!nome) {
      return res.status(400).json({ message: "Nome da turma é obrigatório" });
    }

    const nomeCompleto = escola ? `${nome} - ${escola}` : nome;
    const codigoFinal = codigo || Math.random().toString(36).substring(2, 8).toUpperCase();
    const dataFinal = dataFormatura || `${ano || new Date().getFullYear()}-12-01`;

    const sala = await createSala({
      nome: nomeCompleto,
      codigo: codigoFinal,
      dataFormatura: dataFinal,
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

    console.log("[POST /salas] Sala criada com sucesso:", sala.id);
    res.status(201).json({ sala });
  } catch (e: any) {
    console.error("[POST /salas] Erro:", e);
    res.status(500).json({ message: "Erro ao criar sala", error: e.message });
  }
});

// GET /api/salas/:id
router.get("/:id", async (req, res) => {
  try {
    const sala = await getSalaById(parseInt(req.params.id));
    if (!sala) return res.status(404).json({ message: "Sala não encontrada" });
    res.json(sala);
  } catch (e: any) {
    console.error("[GET /salas/:id] Erro:", e);
    res.status(500).json({ message: "Erro ao buscar sala" });
  }
});

// PATCH /api/salas/:id - Atualizar nome e meta
router.patch("/:id", async (req: any, res: any) => {
  try {
    if (!req.session?.userId || req.session.userRole !== "admin") {
      return res.status(401).json({ message: "Não autorizado" });
    }
    const id = parseInt(req.params.id);
    const { nome, metaValor } = req.body;

    const sala = await updateSala(id, {
      ...(nome !== undefined && { nome }),
      ...(metaValor !== undefined && { metaValor: parseFloat(metaValor) }),
    });

    res.json(sala);
  } catch (e: any) {
    console.error("[PATCH /salas/:id] Erro:", e);
    res.status(500).json({ message: "Erro ao atualizar sala" });
  }
});

// PATCH /api/salas/:id/senha - Alterar senha da sala
router.patch("/:id/senha", async (req: any, res: any) => {
  try {
    if (!req.session?.userId || req.session.userRole !== "admin") {
      return res.status(401).json({ message: "Não autorizado" });
    }
    const id = parseInt(req.params.id);
    const { senha } = req.body;
    if (!senha) return res.status(400).json({ message: "Senha é obrigatória" });

    const sala = await updateSala(id, { senha });
    res.json(sala);
  } catch (e: any) {
    console.error("[PATCH /salas/:id/senha] Erro:", e);
    res.status(500).json({ message: "Erro ao alterar senha" });
  }
});

// DELETE /api/salas/:id - Excluir sala em cascata
router.delete("/:id", async (req: any, res: any) => {
  try {
    if (!req.session?.userId || req.session.userRole !== "admin") {
      return res.status(401).json({ message: "Não autorizado" });
    }
    const id = parseInt(req.params.id);
    await deleteSala(id);
    res.status(204).send();
  } catch (e: any) {
    console.error("[DELETE /salas/:id] Erro:", e);
    res.status(500).json({ message: "Erro ao deletar sala" });
  }
});

export default router;