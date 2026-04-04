import { Router } from "express";
import { getAlunosBySala, getSalaById, createSala } from "../storage.js";
import { supabaseAdmin } from "../db.js";

const router = Router();

// GET /api/salas - listar todas as salas (acesso público para cadastro de aluno)
router.get("/", async (req, res) => {
  try {
    console.log("[GET /salas] Buscando todas as salas...");
    
    const { data, error } = await supabaseAdmin
      .from("salas")
      .select("id, nome, codigo")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("[GET /salas] Erro:", error);
      return res.json([]);
    }
    
    console.log(`[GET /salas] Retornando ${data?.length || 0} salas`);
    res.json(data || []);
  } catch (error) {
    console.error("[GET /salas] Erro:", error);
    res.json([]);
  }
});

// GET /api/salas/:id - buscar sala por ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = await getSalaById(id);
    
    if (!data) {
      return res.status(404).json({ message: "Sala não encontrada" });
    }
    
    res.json(data);
  } catch (error) {
    console.error("[GET /salas/:id] Erro:", error);
    res.status(500).json({ message: "Erro ao buscar sala" });
  }
});

// POST /api/salas - criar nova sala
router.post("/", async (req, res) => {
  try {
    if (!req.session?.userId || req.session.userRole !== "admin") {
      return res.status(401).json({ message: "Não autorizado" });
    }

    if (!req.session.chaveValidada || !req.session.chaveId) {
      return res.status(403).json({
        message: "É necessária uma chave de acesso válida para criar uma turma",
        requiresChave: true,
      });
    }

    const { nome, escola, ano, metaValor, senha, codigo, dataFormatura } = req.body;

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
      senha: senha
    });

    req.session.salaId = sala.id;
    req.session.chaveValidada = false;
    req.session.chaveId = undefined;

    res.status(201).json({ sala });
  } catch (e: any) {
    console.error("[POST /salas] Erro:", e);
    res.status(500).json({ message: "Erro ao criar sala" });
  }
});

export default router;