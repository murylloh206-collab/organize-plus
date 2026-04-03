import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth.js";
import { getCaixaBySala, createMovimento, getSaldoCaixa } from "../storage.js";
import { supabaseAdmin } from "../db.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const result = await getCaixaBySala(req.session.salaId!);
  res.json(result);
});

router.get("/saldo", requireAuth, async (req, res) => {
  const saldo = await getSaldoCaixa(req.session.salaId!);
  res.json({ saldo });
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const dados = {
      ...req.body,
      data: new Date(req.body.data).toISOString(),
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

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, valor, tipo, data, categoria } = req.body;
    
    const dadosAtualizados: any = {};
    if (descricao !== undefined) dadosAtualizados.descricao = descricao;
    if (valor !== undefined) dadosAtualizados.valor = valor;
    if (tipo !== undefined) dadosAtualizados.tipo = tipo;
    if (data !== undefined) dadosAtualizados.data = new Date(data).toISOString();
    if (categoria !== undefined) dadosAtualizados.categoria = categoria;
    dadosAtualizados.updated_at = new Date().toISOString();
    
    const { data: mov, error } = await supabaseAdmin
      .from("caixa")
      .update(dadosAtualizados)
      .eq("id", parseInt(id))
      .select()
      .single();
    
    if (error || !mov) {
      return res.status(404).json({ message: "Movimentação não encontrada" });
    }
    
    res.json(mov);
  } catch (e: any) {
    console.error("Erro ao editar movimento:", e);
    res.status(400).json({ message: e.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabaseAdmin
      .from("caixa")
      .delete()
      .eq("id", parseInt(id));
    
    if (error) {
      return res.status(404).json({ message: "Movimentação não encontrada" });
    }
    
    res.json({ success: true, message: "Movimentação excluída com sucesso" });
  } catch (e: any) {
    console.error("Erro ao deletar movimento:", e);
    res.status(400).json({ message: e.message });
  }
});

export default router;