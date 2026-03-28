// server/routes/ranking.ts
import { Router } from "express";
import { requireAuth } from "../auth.js";
import { db } from "../db.js";
import { usuarios, ticketsRifa, pagamentos, rifas } from "../../shared/schema.js";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

// GET /api/ranking - Ranking de alunos por arrecadação
router.get("/", requireAuth, async (req, res) => {
  try {
    const salaId = req.query.salaId ? parseInt(req.query.salaId as string) : req.session.salaId;
    
    if (!salaId || isNaN(salaId)) {
      return res.status(400).json({ message: "salaId é obrigatório" });
    }

    console.log("Buscando ranking para sala:", salaId);

    // Buscar todos os alunos da sala
    const alunos = await db
      .select({
        alunoId: usuarios.id,
        alunoNome: usuarios.nome,
      })
      .from(usuarios)
      .where(and(
        eq(usuarios.salaId, salaId),
        eq(usuarios.role, "aluno")
      ));

    console.log("Alunos encontrados:", alunos.length);

    // Calcular total arrecadado por aluno
    const ranking = [];
    
    for (const aluno of alunos) {
      // Soma dos pagamentos pagos
      const pagamentosResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${pagamentos.valor})::numeric, 0)`,
          quantidade: sql<number>`COUNT(*)`,
        })
        .from(pagamentos)
        .where(and(
          eq(pagamentos.usuarioId, aluno.alunoId),
          eq(pagamentos.status, "pago"),
          eq(pagamentos.salaId, salaId)
        ));
      
      // Soma das rifas vendidas
      const rifasResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${ticketsRifa.valor})::numeric, 0)`,
          quantidade: sql<number>`COUNT(*)`,
        })
        .from(ticketsRifa)
        .innerJoin(rifas, eq(ticketsRifa.rifaId, rifas.id))
        .where(and(
          eq(ticketsRifa.vendedorId, aluno.alunoId),
          eq(ticketsRifa.status, "pago"),
          eq(rifas.salaId, salaId)
        ));
      
      const totalPagamentos = Number(pagamentosResult[0]?.total) || 0;
      const totalRifas = Number(rifasResult[0]?.total) || 0;
      const quantidadePagamentos = Number(pagamentosResult[0]?.quantidade) || 0;
      const quantidadeRifas = Number(rifasResult[0]?.quantidade) || 0;
      
      const totalArrecadado = totalPagamentos + totalRifas;
      const totalVendas = quantidadePagamentos + quantidadeRifas;
      
      if (totalVendas > 0 || totalArrecadado > 0) {
        ranking.push({
          alunoId: aluno.alunoId,
          alunoNome: aluno.alunoNome,
          totalArrecadado,
          totalVendas,
        });
      }
    }

    // Ordenar
    ranking.sort((a, b) => b.totalArrecadado - a.totalArrecadado);
    
    // Adicionar posição
    const rankingComPosicao = ranking.map((aluno, index) => ({
      ...aluno,
      posicao: index + 1,
    }));

    console.log("Ranking final:", rankingComPosicao.length, "alunos");
    res.json(rankingComPosicao);
  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

export default router;