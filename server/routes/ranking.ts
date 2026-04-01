// server/routes/ranking.ts
import { Router } from "express";
import { requireAuth } from "../auth.js";
import { db } from "../db.js";
import { usuarios, ticketsRifa, pagamentos, rifas } from "../../shared/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";

const router = Router();

function getSalaId(req: any) {
  return req.query.salaId ? parseInt(req.query.salaId as string) : req.session.salaId;
}

// GET /api/ranking - Ranking combinado (compatibilidade)
router.get("/", requireAuth, async (req: any, res: any) => {
  try {
    const salaId = getSalaId(req);
    if (!salaId || isNaN(salaId)) {
      return res.status(400).json({ message: "salaId é obrigatório" });
    }

    const alunos = await db
      .select({ id: usuarios.id, nome: usuarios.nome, avatarUrl: usuarios.avatarUrl })
      .from(usuarios)
      .where(and(eq(usuarios.salaId, salaId), eq(usuarios.role, "aluno")));

    const ranking = [];
    for (const aluno of alunos) {
      const [pags] = await db
        .select({ total: sql<number>`COALESCE(SUM(${pagamentos.valor})::numeric, 0)`, qtd: sql<number>`COUNT(*)` })
        .from(pagamentos)
        .where(and(eq(pagamentos.usuarioId, aluno.id), eq(pagamentos.status, "pago"), eq(pagamentos.salaId, salaId)));

      const [rifasRes] = await db
        .select({ total: sql<number>`COALESCE(SUM(${ticketsRifa.valor})::numeric, 0)`, qtd: sql<number>`COUNT(*)` })
        .from(ticketsRifa)
        .innerJoin(rifas, eq(ticketsRifa.rifaId, rifas.id))
        .where(and(eq(ticketsRifa.vendedorId, aluno.id), eq(ticketsRifa.status, "pago"), eq(rifas.salaId, salaId)));

      const totalArrecadado = Number(pags?.total || 0) + Number(rifasRes?.total || 0);
      const totalVendas = Number(pags?.qtd || 0) + Number(rifasRes?.qtd || 0);

      if (totalVendas > 0 || totalArrecadado > 0) {
        ranking.push({ alunoId: aluno.id, alunoNome: aluno.nome, avatarUrl: aluno.avatarUrl, totalArrecadado, totalVendas });
      }
    }

    ranking.sort((a, b) => b.totalArrecadado - a.totalArrecadado);
    res.json(ranking.map((a, i) => ({ ...a, posicao: i + 1 })));
  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/ranking/rifas - Ranking por tickets de rifas pagos
router.get("/rifas", requireAuth, async (req: any, res: any) => {
  try {
    const salaId = getSalaId(req);
    if (!salaId || isNaN(salaId)) {
      return res.status(400).json({ message: "salaId é obrigatório" });
    }

    const alunos = await db
      .select({ id: usuarios.id, nome: usuarios.nome, avatarUrl: usuarios.avatarUrl })
      .from(usuarios)
      .where(and(eq(usuarios.salaId, salaId), eq(usuarios.role, "aluno")));

    const ranking = [];
    for (const aluno of alunos) {
      const [rifasRes] = await db
        .select({ total: sql<number>`COALESCE(SUM(${ticketsRifa.valor})::numeric, 0)`, qtd: sql<number>`COUNT(*)` })
        .from(ticketsRifa)
        .innerJoin(rifas, eq(ticketsRifa.rifaId, rifas.id))
        .where(and(eq(ticketsRifa.vendedorId, aluno.id), eq(ticketsRifa.status, "pago"), eq(rifas.salaId, salaId)));

      ranking.push({
        alunoId: aluno.id,
        alunoNome: aluno.nome,
        avatarUrl: aluno.avatarUrl,
        totalArrecadado: Number(rifasRes?.total || 0),
        totalVendas: Number(rifasRes?.qtd || 0),
      });
    }

    ranking.sort((a, b) => b.totalArrecadado - a.totalArrecadado);
    res.json(ranking.map((a, i) => ({ ...a, posicao: i + 1 })));
  } catch (error) {
    console.error("Erro ao buscar ranking de rifas:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/ranking/pagamentos - Ranking por pagamentos com status pago
router.get("/pagamentos", requireAuth, async (req: any, res: any) => {
  try {
    const salaId = getSalaId(req);
    if (!salaId || isNaN(salaId)) {
      return res.status(400).json({ message: "salaId é obrigatório" });
    }

    const alunos = await db
      .select({ id: usuarios.id, nome: usuarios.nome, avatarUrl: usuarios.avatarUrl })
      .from(usuarios)
      .where(and(eq(usuarios.salaId, salaId), eq(usuarios.role, "aluno")));

    const ranking = [];
    for (const aluno of alunos) {
      const [pags] = await db
        .select({ total: sql<number>`COALESCE(SUM(${pagamentos.valor})::numeric, 0)`, qtd: sql<number>`COUNT(*)` })
        .from(pagamentos)
        .where(and(eq(pagamentos.usuarioId, aluno.id), eq(pagamentos.status, "pago"), eq(pagamentos.salaId, salaId)));

      ranking.push({
        alunoId: aluno.id,
        alunoNome: aluno.nome,
        avatarUrl: aluno.avatarUrl,
        totalArrecadado: Number(pags?.total || 0),
        totalVendas: Number(pags?.qtd || 0),
      });
    }

    ranking.sort((a, b) => b.totalArrecadado - a.totalArrecadado);
    res.json(ranking.map((a, i) => ({ ...a, posicao: i + 1 })));
  } catch (error) {
    console.error("Erro ao buscar ranking de pagamentos:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/ranking/devedores - Em breve
router.get("/devedores", requireAuth, async (_req: any, res: any) => {
  res.json({ emBreve: true });
});

export default router;