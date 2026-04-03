import { Router } from "express";
import { requireAuth } from "../auth.js";
import { supabaseAdmin } from "../db.js";

const router = Router();

function getSalaId(req: any) {
  return req.query.salaId ? parseInt(req.query.salaId as string) : req.session.salaId;
}

router.get("/", requireAuth, async (req: any, res: any) => {
  try {
    const salaId = getSalaId(req);
    if (!salaId) return res.status(400).json({ message: "salaId é obrigatório" });

    const { data: alunos } = await supabaseAdmin.from("usuarios").select("id, nome, avatar_url").eq("sala_id", salaId).eq("role", "aluno");
    if (!alunos) return res.json([]);

    const { data: pags } = await supabaseAdmin.from("pagamentos").select("usuario_id, valor").eq("sala_id", salaId).eq("status", "pago");
    const pagMap: Record<number, {total: number, qtd: number}> = {};
    (pags || []).forEach(p => {
        if (!pagMap[p.usuario_id]) pagMap[p.usuario_id] = {total: 0, qtd: 0};
        pagMap[p.usuario_id].total += parseFloat(p.valor);
        pagMap[p.usuario_id].qtd += 1;
    });

    const { data: rifas } = await supabaseAdmin.from("rifas").select("id").eq("sala_id", salaId);
    const rifaIds = (rifas || []).map(r => r.id);
    const rifaMap: Record<number, {total: number, qtd: number}> = {};
    
    if (rifaIds.length > 0) {
        const { data: tickets } = await supabaseAdmin.from("tickets_rifa").select("vendedor_id, valor").in("rifa_id", rifaIds).eq("status", "pago");
        (tickets || []).forEach(t => {
            if (!rifaMap[t.vendedor_id]) rifaMap[t.vendedor_id] = {total: 0, qtd: 0};
            rifaMap[t.vendedor_id].total += parseFloat(t.valor);
            rifaMap[t.vendedor_id].qtd += 1;
        });
    }

    const ranking = alunos.map(aluno => {
        const rp = pagMap[aluno.id] || {total:0, qtd:0};
        const rr = rifaMap[aluno.id] || {total:0, qtd:0};
        return {
            alunoId: aluno.id,
            alunoNome: aluno.nome,
            avatarUrl: aluno.avatar_url,
            totalArrecadado: rp.total + rr.total,
            totalVendas: rp.qtd + rr.qtd,
        }
    }).filter(a => a.totalVendas > 0 || a.totalArrecadado > 0);

    ranking.sort((a, b) => b.totalArrecadado - a.totalArrecadado);
    res.json(ranking.map((a, i) => ({ ...a, posicao: i + 1 })));
  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

router.get("/rifas", requireAuth, async (req: any, res: any) => {
    try {
        const salaId = getSalaId(req);
        if (!salaId) return res.status(400).json({ message: "salaId é obrigatório" });
    
        const { data: alunos } = await supabaseAdmin.from("usuarios").select("id, nome, avatar_url").eq("sala_id", salaId).eq("role", "aluno");
        if (!alunos) return res.json([]);
    
        const { data: rifas } = await supabaseAdmin.from("rifas").select("id").eq("sala_id", salaId);
        const rifaIds = (rifas || []).map(r => r.id);
        const rifaMap: Record<number, {total: number, qtd: number}> = {};
        
        if (rifaIds.length > 0) {
            const { data: tickets } = await supabaseAdmin.from("tickets_rifa").select("vendedor_id, valor").in("rifa_id", rifaIds).eq("status", "pago");
            (tickets || []).forEach(t => {
                if (!rifaMap[t.vendedor_id]) rifaMap[t.vendedor_id] = {total: 0, qtd: 0};
                rifaMap[t.vendedor_id].total += parseFloat(t.valor);
                rifaMap[t.vendedor_id].qtd += 1;
            });
        }
    
        const ranking = alunos.map(aluno => {
            const rr = rifaMap[aluno.id] || {total:0, qtd:0};
            return {
                alunoId: aluno.id,
                alunoNome: aluno.nome,
                avatarUrl: aluno.avatar_url,
                totalArrecadado: rr.total,
                totalVendas: rr.qtd,
            }
        });
    
        ranking.sort((a, b) => b.totalArrecadado - a.totalArrecadado);
        res.json(ranking.map((a, i) => ({ ...a, posicao: i + 1 })));
      } catch (error) {
        console.error("Erro ao buscar ranking:", error);
        res.status(500).json({ message: "Erro interno" });
      }
});

router.get("/pagamentos", requireAuth, async (req: any, res: any) => {
    try {
        const salaId = getSalaId(req);
        if (!salaId) return res.status(400).json({ message: "salaId é obrigatório" });
    
        const { data: alunos } = await supabaseAdmin.from("usuarios").select("id, nome, avatar_url").eq("sala_id", salaId).eq("role", "aluno");
        if (!alunos) return res.json([]);
    
        const { data: pags } = await supabaseAdmin.from("pagamentos").select("usuario_id, valor").eq("sala_id", salaId).eq("status", "pago");
        const pagMap: Record<number, {total: number, qtd: number}> = {};
        (pags || []).forEach(p => {
            if (!pagMap[p.usuario_id]) pagMap[p.usuario_id] = {total: 0, qtd: 0};
            pagMap[p.usuario_id].total += parseFloat(p.valor);
            pagMap[p.usuario_id].qtd += 1;
        });
    
        const ranking = alunos.map(aluno => {
            const rp = pagMap[aluno.id] || {total:0, qtd:0};
            return {
                alunoId: aluno.id,
                alunoNome: aluno.nome,
                avatarUrl: aluno.avatar_url,
                totalArrecadado: rp.total,
                totalVendas: rp.qtd,
            }
        });
    
        ranking.sort((a, b) => b.totalArrecadado - a.totalArrecadado);
        res.json(ranking.map((a, i) => ({ ...a, posicao: i + 1 })));
      } catch (error) {
        console.error("Erro ao buscar ranking:", error);
        res.status(500).json({ message: "Erro interno" });
      }
});

router.get("/devedores", requireAuth, async (_req: any, res: any) => {
  res.json({ emBreve: true });
});

export default router;