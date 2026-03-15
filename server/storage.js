import { db } from "./db.js";
import { usuarios, salas, chaves, rifas, ticketsRifa, pagamentos, eventos, metas, caixa } from "../shared/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { hashSenha } from "./auth.js";
// ---------- USUARIOS ----------
export async function getUserById(id) {
    const [user] = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
    return user;
}
export async function getUserByEmail(email) {
    const [user] = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
    return user;
}
export async function createUser(data) {
    const senhaHash = await hashSenha(data.senha);
    const [user] = await db.insert(usuarios).values({
        nome: data.nome, email: data.email, senhaHash,
        role: data.role ?? "aluno", salaId: data.salaId ?? null,
    }).returning();
    return user;
}
export async function getAlunosBySala(salaId) {
    return db.select().from(usuarios)
        .where(and(eq(usuarios.salaId, salaId), eq(usuarios.role, "aluno")))
        .orderBy(usuarios.nome);
}
// ---------- SALAS ----------
export async function getSalaById(id) {
    const [sala] = await db.select().from(salas).where(eq(salas.id, id)).limit(1);
    return sala;
}
export async function createSala(data) {
    const [sala] = await db.insert(salas).values({
        nome: data.nome, codigo: data.codigo,
        dataFormatura: data.dataFormatura ? new Date(data.dataFormatura) : null,
        metaValor: data.metaValor?.toString() ?? "0",
    }).returning();
    return sala;
}
// ---------- CHAVES ----------
export async function getChaveByCode(chave) {
    const [ch] = await db.select().from(chaves).where(eq(chaves.chave, chave)).limit(1);
    return ch;
}
export async function marcarChaveUsada(chaveId, usuarioId) {
    await db.update(chaves).set({ ativa: false, usadaPor: usuarioId }).where(eq(chaves.id, chaveId));
}
// ---------- RIFAS ----------
export async function getRifasBySala(salaId) {
    return db.select().from(rifas).where(eq(rifas.salaId, salaId)).orderBy(desc(rifas.createdAt));
}
export async function createRifa(data) {
    const [rifa] = await db.insert(rifas).values(data).returning();
    return rifa;
}
export async function updateRifa(id, data) {
    const [rifa] = await db.update(rifas).set(data).where(eq(rifas.id, id)).returning();
    return rifa;
}
// ---------- TICKETS ----------
export async function getTicketsByRifa(rifaId) {
    return db.select().from(ticketsRifa).where(eq(ticketsRifa.rifaId, rifaId));
}
export async function getTicketsByVendedor(vendedorId) {
    return db.select().from(ticketsRifa).where(eq(ticketsRifa.vendedorId, vendedorId)).orderBy(desc(ticketsRifa.createdAt));
}
export async function createTicket(data) {
    const [ticket] = await db.insert(ticketsRifa).values(data).returning();
    return ticket;
}
export async function updateTicket(id, status) {
    const [ticket] = await db.update(ticketsRifa).set({ status }).where(eq(ticketsRifa.id, id)).returning();
    return ticket;
}
// ---------- PAGAMENTOS ----------
export async function getPagamentosBySala(salaId) {
    return db.select({
        pagamento: pagamentos,
        usuario: { nome: usuarios.nome, email: usuarios.email, avatarUrl: usuarios.avatarUrl },
    })
        .from(pagamentos)
        .leftJoin(usuarios, eq(pagamentos.usuarioId, usuarios.id))
        .where(eq(pagamentos.salaId, salaId))
        .orderBy(desc(pagamentos.createdAt));
}
export async function getPagamentosByUsuario(usuarioId) {
    return db.select().from(pagamentos).where(eq(pagamentos.usuarioId, usuarioId)).orderBy(desc(pagamentos.dataVencimento));
}
export async function createPagamento(data) {
    const [pag] = await db.insert(pagamentos).values(data).returning();
    return pag;
}
export async function updatePagamento(id, data) {
    const [pag] = await db.update(pagamentos).set(data).where(eq(pagamentos.id, id)).returning();
    return pag;
}
// ---------- EVENTOS ----------
export async function getEventosBySala(salaId) {
    return db.select().from(eventos).where(eq(eventos.salaId, salaId)).orderBy(desc(eventos.data));
}
export async function createEvento(data) {
    const [ev] = await db.insert(eventos).values(data).returning();
    return ev;
}
export async function updateEvento(id, data) {
    const [ev] = await db.update(eventos).set(data).where(eq(eventos.id, id)).returning();
    return ev;
}
export async function deleteEvento(id) {
    await db.delete(eventos).where(eq(eventos.id, id));
}
// ---------- METAS ----------
export async function getMetasBySala(salaId) {
    return db.select().from(metas).where(eq(metas.salaId, salaId));
}
export async function createMeta(data) {
    const [meta] = await db.insert(metas).values(data).returning();
    return meta;
}
export async function updateMeta(id, data) {
    const [meta] = await db.update(metas).set({ ...data, updatedAt: new Date() }).where(eq(metas.id, id)).returning();
    return meta;
}
// ---------- CAIXA ----------
export async function getCaixaBySala(salaId) {
    return db.select({
        mov: caixa,
        usuario: { nome: usuarios.nome },
    })
        .from(caixa)
        .leftJoin(usuarios, eq(caixa.createdBy, usuarios.id))
        .where(eq(caixa.salaId, salaId))
        .orderBy(desc(caixa.data));
}
export async function createMovimento(data) {
    const [mov] = await db.insert(caixa).values(data).returning();
    return mov;
}
export async function getSaldoCaixa(salaId) {
    const result = await db
        .select({
        total: sql `
        SUM(CASE WHEN tipo = 'entrada' THEN valor::numeric ELSE -valor::numeric END)
      `.as("total"),
    })
        .from(caixa)
        .where(eq(caixa.salaId, salaId));
    return parseFloat(result[0]?.total ?? "0");
}
// ---------- DASHBOARD STATS ----------
export async function getDashboardStats(salaId) {
    const [pagsResult] = await db
        .select({
        total: sql `SUM(CASE WHEN status = 'pago' THEN valor::numeric ELSE 0 END)`.as("total"),
    })
        .from(pagamentos).where(eq(pagamentos.salaId, salaId));
    const [alunosResult] = await db
        .select({ count: sql `COUNT(*)`.as("count") })
        .from(usuarios)
        .where(and(eq(usuarios.salaId, salaId), eq(usuarios.role, "aluno")));
    const [ticketsResult] = await db
        .select({ count: sql `COUNT(*)`.as("count") })
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
