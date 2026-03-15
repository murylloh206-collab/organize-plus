import { Router } from "express";
import { db } from "../db.js";
import { pagamentos, usuarios, rifas, caixa, salas } from "../../shared/schema.js";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

// GET /api/dashboard/stats?salaId=1
router.get("/stats", async (req, res) => {
  try {
    const salaId = parseInt(req.query.salaId as string);
    
    if (!salaId) {
      return res.status(400).json({ message: "salaId é obrigatório" });
    }

    // Total arrecadado
    const [totalArrecadado] = await db
      .select({ valor: sql`COALESCE(SUM(${pagamentos.valor}), 0)` })
      .from(pagamentos)
      .where(eq(pagamentos.salaId, salaId));

    // Total de alunos ativos (role = 'aluno')
    const [totalAlunos] = await db
      .select({ count: sql`COUNT(*)` })
      .from(usuarios)
      .where(and(
        eq(usuarios.salaId, salaId),
        eq(usuarios.role, "aluno")
      ));

    // Total de rifas vendidas
    const [totalRifas] = await db
      .select({ count: sql`COUNT(*)` })
      .from(rifas)
      .where(eq(rifas.salaId, salaId));

    // Saldo do caixa
    const [saldoCaixa] = await db
      .select({ valor: sql`COALESCE(SUM(
        CASE 
          WHEN ${caixa.tipo} = 'entrada' THEN ${caixa.valor}
          WHEN ${caixa.tipo} = 'saida' THEN -${caixa.valor}
          ELSE 0
        END
      ), 0)` })
      .from(caixa)
      .where(eq(caixa.salaId, salaId));

    res.json({
      totalArrecadado: Number(totalArrecadado.valor),
      totalAlunos: Number(totalAlunos.count),
      totalTickets: Number(totalRifas.count),
      saldoCaixa: Number(saldoCaixa.valor),
      variacaoArrecadado: 12.5,
      variacaoAlunos: 3.2,
      variacaoRifas: 15.8
    });

  } catch (error) {
    console.error("❌ Erro ao buscar stats:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/dashboard/recentes?salaId=1&limite=8
router.get("/recentes", async (req, res) => {
  try {
    const salaId = parseInt(req.query.salaId as string);
    const limite = parseInt(req.query.limite as string) || 8;

    const recentes = await db
      .select({
        id: pagamentos.id,
        valor: pagamentos.valor,
        data: pagamentos.createdAt,
        status: pagamentos.status,
        alunoNome: usuarios.nome
      })
      .from(pagamentos)
      .innerJoin(usuarios, eq(pagamentos.usuarioId, usuarios.id))
      .where(eq(pagamentos.salaId, salaId))
      .orderBy(sql`${pagamentos.createdAt} DESC`)
      .limit(limite);

    res.json(recentes);
  } catch (error) {
    console.error("❌ Erro ao buscar pagamentos recentes:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/dashboard/formatura?salaId=1
router.get("/formatura", async (req, res) => {
  try {
    const salaId = parseInt(req.query.salaId as string);

    const [sala] = await db
      .select({ metaTotal: salas.metaValor })
      .from(salas)
      .where(eq(salas.id, salaId));

    const [totalPago] = await db
      .select({ valor: sql`COALESCE(SUM(${pagamentos.valor}), 0)` })
      .from(pagamentos)
      .where(eq(pagamentos.salaId, salaId));

    const metaTotal = Number(sala?.metaTotal || 0);
    const arrecadado = Number(totalPago.valor);
    const percentual = metaTotal > 0 ? Math.round((arrecadado / metaTotal) * 100) : 0;

    res.json({
      metaTotal,
      arrecadado,
      percentual
    });

  } catch (error) {
    console.error("❌ Erro ao buscar meta:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/dashboard/mensal?salaId=1
router.get("/mensal", async (req, res) => {
  try {
    const salaId = parseInt(req.query.salaId as string);

    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

    const pagamentosMensais = await db
      .select({
        mes: sql`EXTRACT(MONTH FROM ${pagamentos.createdAt})`,
        total: sql`COALESCE(SUM(${pagamentos.valor}), 0)`
      })
      .from(pagamentos)
      .where(and(
        eq(pagamentos.salaId, salaId),
        sql`${pagamentos.createdAt} >= ${seisMesesAtras}`
      ))
      .groupBy(sql`EXTRACT(MONTH FROM ${pagamentos.createdAt})`)
      .orderBy(sql`EXTRACT(MONTH FROM ${pagamentos.createdAt})`);

    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
    
    // Calcular valores normalizados para o gráfico
    const valores = meses.map((_, idx) => {
      const mes = idx + 1;
      const encontrado = pagamentosMensais.find(p => Number(p.mes) === mes);
      
      // Se não houver dados, retorna 0
      if (!encontrado) return 0;
      
      // Normaliza para percentual (0-100)
      const valorTotal = Number(encontrado.total);
      return Math.min(100, Math.round(valorTotal / 1000)); // Cada 1000 reais = 10%
    });

    res.json({
      meses,
      valores,
      mesAtual: new Date().getMonth()
    });

  } catch (error) {
    console.error("❌ Erro ao buscar receita mensal:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

export default router;