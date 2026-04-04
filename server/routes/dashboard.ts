import { Router } from "express";
import { supabaseAdmin } from "../db.js";

const router = Router();

// GET /api/dashboard/stats - Dados principais do dashboard
router.get("/stats", async (req, res) => {
  try {
    const salaId = parseInt(req.query.salaId as string);
    if (!salaId) return res.status(400).json({ message: "salaId é obrigatório" });

    // Buscar dados da sala (meta_valor)
    const { data: sala } = await supabaseAdmin
      .from("salas")
      .select("meta_valor, nome")
      .eq("id", salaId)
      .single();

    // Pagamentos
    const { data: pags } = await supabaseAdmin
      .from("pagamentos")
      .select("valor, status")
      .eq("sala_id", salaId);
    
    const totalPago = pags?.filter(p => p.status === "pago").reduce((s, p) => s + parseFloat(p.valor), 0) || 0;
    const totalArrecadado = totalPago;

    // Alunos
    const { count: totalAlunos } = await supabaseAdmin
      .from("usuarios")
      .select("*", { count: "exact", head: true })
      .eq("sala_id", salaId)
      .eq("role", "aluno");

    // Rifas
    const { data: rifas } = await supabaseAdmin
      .from("rifas")
      .select("id")
      .eq("sala_id", salaId);
    
    let totalTickets = 0;
    if (rifas && rifas.length > 0) {
      const { count } = await supabaseAdmin
        .from("tickets_rifa")
        .select("*", { count: "exact", head: true })
        .in("rifa_id", rifas.map(r => r.id));
      totalTickets = count || 0;
    }

    // Caixa
    const { data: caixas } = await supabaseAdmin
      .from("caixa")
      .select("valor, tipo")
      .eq("sala_id", salaId);
    
    const saldoCaixa = caixas?.reduce((acc, mov) => 
      acc + (mov.tipo === "entrada" ? parseFloat(mov.valor) : -parseFloat(mov.valor)), 0) || 0;

    // Meta da sala
    const metaSala = parseFloat(sala?.meta_valor || "0");
    const percentualMeta = metaSala > 0 ? Math.round((totalArrecadado / metaSala) * 100) : 0;

    res.json({
      totalArrecadado,
      totalAlunos: totalAlunos || 0,
      totalTickets,
      saldoCaixa,
      metaSala,
      percentualMeta,
      nomeSala: sala?.nome || "",
      variacaoArrecadado: 0,
      variacaoAlunos: 0,
      variacaoRifas: 0
    });
  } catch (error) {
    console.error("❌ Erro ao buscar stats:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/dashboard/recentes - Pagamentos recentes
router.get("/recentes", async (req, res) => {
  try {
    const salaId = parseInt(req.query.salaId as string);
    const limite = parseInt(req.query.limite as string) || 8;

    const { data } = await supabaseAdmin
      .from("pagamentos")
      .select("id, valor, status, created_at, usuarios!usuario_id(nome)")
      .eq("sala_id", salaId)
      .order("created_at", { ascending: false })
      .limit(limite);

    const recentes = data?.map((p: any) => ({
      id: p.id,
      valor: p.valor,
      data: p.created_at,
      status: p.status,
      alunoNome: p.usuarios?.nome
    })) || [];

    res.json(recentes);
  } catch (error) {
    console.error("❌ Erro ao buscar pagamentos recentes:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/dashboard/formatura - Meta da formatura (mantido para compatibilidade)
router.get("/formatura", async (req, res) => {
  try {
    const salaId = parseInt(req.query.salaId as string);

    const { data: sala } = await supabaseAdmin.from("salas").select("meta_valor").eq("id", salaId).single();
    const { data: pags } = await supabaseAdmin.from("pagamentos").select("valor").eq("sala_id", salaId).eq("status", "pago");

    const metaTotal = Number(sala?.meta_valor || 0);
    const arrecadado = pags?.reduce((s, p) => s + parseFloat(p.valor), 0) || 0;
    const percentual = metaTotal > 0 ? Math.round((arrecadado / metaTotal) * 100) : 0;

    res.json({ metaTotal, arrecadado, percentual });
  } catch (error) {
    console.error("❌ Erro ao buscar meta:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/dashboard/mensal - Receita mensal para gráfico
router.get("/mensal", async (req, res) => {
  try {
    const salaId = parseInt(req.query.salaId as string);
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

    const { data: pags } = await supabaseAdmin
      .from("pagamentos")
      .select("valor, created_at")
      .eq("sala_id", salaId)
      .gte("created_at", seisMesesAtras.toISOString());
    
    // Agrupar por mês
    const agg: Record<number, number> = {};
    if (pags) {
      for (const p of pags) {
        const d = new Date(p.created_at);
        const m = d.getMonth() + 1;
        agg[m] = (agg[m] || 0) + parseFloat(p.valor);
      }
    }

    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
    const valores = [];
    for (let i = 1; i <= 6; i++) {
      valores.push(agg[i] || 0);
    }

    res.json({ meses, valores, mesAtual: new Date().getMonth() });
  } catch (error) {
    console.error("❌ Erro ao buscar receita mensal:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

export default router;