import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth.js";
import { getCaixaBySala, createMovimento, getSaldoCaixa } from "../storage.js";
import { db } from "../db.js";
import { caixa } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const result = await getCaixaBySala(req.session.salaId!);
  // Já retorna no formato { mov, usuario }
  res.json(result);
});

router.get("/saldo", requireAuth, async (req, res) => {
  const saldo = await getSaldoCaixa(req.session.salaId!);
  res.json({ saldo });
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    // Converte a data de string para Date
    const dados = {
      ...req.body,
      data: new Date(req.body.data),
      salaId: req.session.salaId!,
      createdBy: req.session.userId!,
    };
    
    const mov = await createMovimento(dados);
    res.json(mov);
  } catch (e: any) {
    console.error("Erro ao criar movimento:", e);
    res.status(400).json({ message: e.message });
  }
});

// ADICIONAR: PATCH para editar movimentação
router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, valor, tipo, data, categoria } = req.body;
    
    const dadosAtualizados: any = {};
    if (descricao !== undefined) dadosAtualizados.descricao = descricao;
    if (valor !== undefined) dadosAtualizados.valor = valor;
    if (tipo !== undefined) dadosAtualizados.tipo = tipo;
    if (data !== undefined) dadosAtualizados.data = new Date(data);
    if (categoria !== undefined) dadosAtualizados.categoria = categoria;
    dadosAtualizados.updatedAt = new Date();
    
    const [mov] = await db
      .update(caixa)
      .set(dadosAtualizados)
      .where(eq(caixa.id, parseInt(id)))
      .returning();
    
    if (!mov) {
      return res.status(404).json({ message: "Movimentação não encontrada" });
    }
    
    res.json(mov);
  } catch (e: any) {
    console.error("Erro ao editar movimento:", e);
    res.status(400).json({ message: e.message });
  }
});

// ADICIONAR: DELETE para remover movimentação
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [mov] = await db
      .delete(caixa)
      .where(eq(caixa.id, parseInt(id)))
      .returning();
    
    if (!mov) {
      return res.status(404).json({ message: "Movimentação não encontrada" });
    }
    
    res.json({ success: true, message: "Movimentação excluída com sucesso" });
  } catch (e: any) {
    console.error("Erro ao deletar movimento:", e);
    res.status(400).json({ message: e.message });
  }
});

export default router;