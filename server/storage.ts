import { db } from "./db.js";
import {
  usuarios, salas, chaves, rifas, ticketsRifa,
  pagamentos, eventos, metas, caixa
} from "../shared/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { hashSenha } from "./auth.js";

// ---------- USUARIOS ----------
export async function getUserById(id: number) {
  const [user] = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
  return user;
}

export async function createUser(data: {
  nome: string; email: string; senha: string;
  role?: "admin" | "aluno"; salaId?: number; celular?: string;
}) {
  const senhaHash = await hashSenha(data.senha);
  const [user] = await db.insert(usuarios).values({
    nome: data.nome, email: data.email, senhaHash,
    celular: data.celular ?? null,
    role: data.role ?? "aluno", salaId: data.salaId ?? null,
  }).returning();
  return user;
}

export async function getAlunosBySala(salaId: number) {
  return db.select().from(usuarios)
    .where(and(eq(usuarios.salaId, salaId), eq(usuarios.role, "aluno")))
    .orderBy(usuarios.nome);
}

// ---------- SALAS ----------
export async function getSalaById(id: number) {
  const [sala] = await db.select().from(salas).where(eq(salas.id, id)).limit(1);
  return sala;
}

export async function createSala(data: { nome: string; codigo: string; dataFormatura?: string; metaValor?: number; senha?: string }) {
  const [sala] = await db.insert(salas).values({
    nome: data.nome, codigo: data.codigo,
    dataFormatura: data.dataFormatura ? new Date(data.dataFormatura) : null,
    metaValor: data.metaValor?.toString() ?? "0",
    senha: data.senha ?? null,
  }).returning();
  return sala;
}

// ---------- CHAVES ----------
export async function getChaveByCode(chave: string) {
  const [ch] = await db.select().from(chaves).where(eq(chaves.chave, chave)).limit(1);
  return ch;
}

export async function marcarChaveUsada(chaveId: number, usuarioId: number) {
  await db.update(chaves).set({ ativa: false, usadaPor: usuarioId }).where(eq(chaves.id, chaveId));
}

// ---------- RIFAS ----------
export async function getRifasBySala(salaId: number) {
  return db.select().from(rifas).where(eq(rifas.salaId, salaId)).orderBy(desc(rifas.createdAt));
}

export async function createRifa(data: typeof rifas.$inferInsert) {
  const [rifa] = await db.insert(rifas).values(data).returning();
  return rifa;
}

export async function updateRifa(id: number, data: Partial<typeof rifas.$inferInsert>) {
  const [rifa] = await db.update(rifas).set(data).where(eq(rifas.id, id)).returning();
  return rifa;
}

// ---------- TICKETS ----------
export async function getTicketsByRifa(rifaId: number) {
  return db.select().from(ticketsRifa).where(eq(ticketsRifa.rifaId, rifaId));
}

export async function getTicketsByVendedor(vendedorId: number) {
  return db.select().from(ticketsRifa).where(eq(ticketsRifa.vendedorId, vendedorId)).orderBy(desc(ticketsRifa.createdAt));
}

export async function createTicket(data: typeof ticketsRifa.$inferInsert) {
  const [ticket] = await db.insert(ticketsRifa).values(data).returning();
  return ticket;
}

export async function updateTicket(id: number, status: "pago" | "pendente") {
  const [ticket] = await db.update(ticketsRifa).set({ status }).where(eq(ticketsRifa.id, id)).returning();
  return ticket;
}

// ---------- PAGAMENTOS ----------
export async function getPagamentosBySala(salaId: number) {
  return db.select({
    pagamento: pagamentos,
    usuario: { nome: usuarios.nome, email: usuarios.email, avatarUrl: usuarios.avatarUrl },
  })
    .from(pagamentos)
    .leftJoin(usuarios, eq(pagamentos.usuarioId, usuarios.id))
    .where(eq(pagamentos.salaId, salaId))
    .orderBy(desc(pagamentos.createdAt));
}

export async function getPagamentosByUsuario(usuarioId: number) {
  return db.select().from(pagamentos).where(eq(pagamentos.usuarioId, usuarioId)).orderBy(desc(pagamentos.dataVencimento));
}

export async function createPagamento(data: typeof pagamentos.$inferInsert) {
  const [pag] = await db.insert(pagamentos).values(data).returning();
  return pag;
}

export async function updatePagamento(id: number, data: Partial<typeof pagamentos.$inferInsert>) {
  const [pag] = await db.update(pagamentos).set(data).where(eq(pagamentos.id, id)).returning();
  return pag;
}

// ---------- EVENTOS ----------
export async function getEventosBySala(salaId: number) {
  return db.select().from(eventos).where(eq(eventos.salaId, salaId)).orderBy(desc(eventos.data));
}

export async function createEvento(data: typeof eventos.$inferInsert) {
  const [ev] = await db.insert(eventos).values(data).returning();
  return ev;
}

export async function updateEvento(id: number, data: Partial<typeof eventos.$inferInsert>) {
  const [ev] = await db.update(eventos).set(data).where(eq(eventos.id, id)).returning();
  return ev;
}

export async function deleteEvento(id: number) {
  await db.delete(eventos).where(eq(eventos.id, id));
}

// ---------- METAS ----------
export async function getMetasBySala(salaId: number) {
  return db.select().from(metas).where(eq(metas.salaId, salaId));
}

export async function createMeta(data: typeof metas.$inferInsert) {
  const [meta] = await db.insert(metas).values(data).returning();
  return meta;
}

export async function updateMeta(id: number, data: Partial<typeof metas.$inferInsert>) {
  const [meta] = await db.update(metas).set({ ...data, updatedAt: new Date() }).where(eq(metas.id, id)).returning();
  return meta;
}

// ---------- CAIXA ----------
export async function getCaixaBySala(salaId: number) {
  return db.select({
    mov: caixa,
    usuario: { nome: usuarios.nome },
  })
    .from(caixa)
    .leftJoin(usuarios, eq(caixa.createdBy, usuarios.id))
    .where(eq(caixa.salaId, salaId))
    .orderBy(desc(caixa.data));
}

export async function createMovimento(data: typeof caixa.$inferInsert) {
  const [mov] = await db.insert(caixa).values(data).returning();
  return mov;
}

export async function getSaldoCaixa(salaId: number) {
  const result = await db
    .select({
      total: sql<string>`
        SUM(CASE WHEN tipo = 'entrada' THEN valor::numeric ELSE -valor::numeric END)
      `.as("total"),
    })
    .from(caixa)
    .where(eq(caixa.salaId, salaId));
  return parseFloat(result[0]?.total ?? "0");
}

// ---------- DASHBOARD STATS ----------
export async function getDashboardStats(salaId: number) {
  const [pagsResult] = await db
    .select({
      total: sql<string>`SUM(CASE WHEN status = 'pago' THEN valor::numeric ELSE 0 END)`.as("total"),
    })
    .from(pagamentos).where(eq(pagamentos.salaId, salaId));

  const [alunosResult] = await db
    .select({ count: sql<string>`COUNT(*)`.as("count") })
    .from(usuarios)
    .where(and(eq(usuarios.salaId, salaId), eq(usuarios.role, "aluno")));

  const [ticketsResult] = await db
    .select({ count: sql<string>`COUNT(*)`.as("count") })
    .from(ticketsRifa)
    .leftJoin(rifas, eq(ticketsRifa.rifaId, rifas.id))
    .where(eq(rifas.salaId, salaId));

  const saldo = await getSaldoCaixa(salaId);

  return {
    totalArrecadado: parseFloat(pagsResult?.total ?? "0"),
    totalAlunos: parseInt(alunosResult?.count ?? "0"),
    totalTickets: parseInt(ticketsResult?.count ?? "0"),
    saldoCaixa: saldo,
  };
}
