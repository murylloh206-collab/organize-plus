import { db } from "./db.js";
import {
  usuarios, salas, chaves, rifas, ticketsRifa,
  pagamentos, eventos, metas, caixa,
  type InsertUsuario
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

// ---------- Edit dos alunos ----------
export async function updateUser(id: number, data: Partial<InsertUsuario>) {
  const [user] = await db
    .update(usuarios)
    .set(data)
    .where(eq(usuarios.id, id))
    .returning();
  return user;
}

export async function deleteUser(id: number) {
  await db
    .delete(usuarios)
    .where(eq(usuarios.id, id));
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

export async function getRifaById(id: number) {
  const [rifa] = await db.select().from(rifas).where(eq(rifas.id, id)).limit(1);
  return rifa;
}

export async function createRifa(data: typeof rifas.$inferInsert) {
  // Garantir que totalNumeros tenha um valor padrão
  const dadosCompletos = {
    ...data,
    totalNumeros: data.totalNumeros || 200
  };
  const [rifa] = await db.insert(rifas).values(dadosCompletos).returning();
  return rifa;
}

export async function updateRifa(id: number, data: Partial<typeof rifas.$inferInsert>) {
  // Remover campos que não existem no schema ou não devem ser atualizados
  const { updatedAt, createdAt, ...dataLimpa } = data as any;
  
  const [rifa] = await db
    .update(rifas)
    .set({
      ...dataLimpa,
      updatedAt: new Date()
    })
    .where(eq(rifas.id, id))
    .returning();
  return rifa;
}

export async function deleteRifa(id: number) {
  // Primeiro deletar todos os tickets associados
  await db.delete(ticketsRifa).where(eq(ticketsRifa.rifaId, id));
  // Depois deletar a rifa
  await db.delete(rifas).where(eq(rifas.id, id));
}

export async function marcarRifaComoSorteada(id: number, vencedorId: number, numeroSorteado?: number) {
  // Preparar dados de atualização
  const updateData: any = {
    status: "sorteada",
    vencedorId,
    dataSorteio: new Date(),
    updatedAt: new Date()
  };
  
  // Se tiver número sorteado, adicionar
  if (numeroSorteado) {
    updateData.numeroSorteado = numeroSorteado;
  }
  
  const [rifa] = await db
    .update(rifas)
    .set(updateData)
    .where(eq(rifas.id, id))
    .returning();
  return rifa;
}

// ---------- TICKETS ----------
export async function getTicketsByRifa(rifaId: number) {
  const tickets = await db
    .select({
      ticket: ticketsRifa,
      vendedor: { nome: usuarios.nome, email: usuarios.email }
    })
    .from(ticketsRifa)
    .leftJoin(usuarios, eq(ticketsRifa.vendedorId, usuarios.id))
    .where(eq(ticketsRifa.rifaId, rifaId))
    .orderBy(ticketsRifa.numero);
  
  // Mapear para incluir nome do vendedor
  return tickets.map(t => ({
    ...t.ticket,
    vendedorNome: t.vendedor?.nome
  }));
}

export async function getTicketsByVendedor(vendedorId: number) {
  return db.select().from(ticketsRifa).where(eq(ticketsRifa.vendedorId, vendedorId)).orderBy(desc(ticketsRifa.createdAt));
}

export async function createTicket(data: typeof ticketsRifa.$inferInsert) {
  // Verificar se o número já existe para esta rifa
  const ticketsExistentes = await db
    .select()
    .from(ticketsRifa)
    .where(and(
      eq(ticketsRifa.rifaId, data.rifaId),
      eq(ticketsRifa.numero, data.numero)
    ));
  
  if (ticketsExistentes.length > 0) {
    throw new Error("Número já está ocupado nesta rifa");
  }

  const [ticket] = await db.insert(ticketsRifa).values({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();
  return ticket;
}

export async function updateTicket(id: number, status: "pago" | "pendente" | "cancelado") {
  const [ticket] = await db
    .update(ticketsRifa)
    .set({ 
      status, 
      updatedAt: new Date() 
    })
    .where(eq(ticketsRifa.id, id))
    .returning();
  return ticket;
}

// NOVA FUNÇÃO: Atualizar dados completos do ticket
// NOVA FUNÇÃO: Atualizar dados completos do ticket
export async function updateTicketData(id: number, data: {
  compradorNome: string;
  compradorContato: string | null;
  vendedorId: number;
  valor: string;
  status?: "pago" | "pendente" | "cancelado"; // Tipo específico
}) {
  const [ticket] = await db
    .update(ticketsRifa)
    .set({
      compradorNome: data.compradorNome,
      compradorContato: data.compradorContato,
      vendedorId: data.vendedorId,
      valor: data.valor,
      status: data.status || "pendente",
      updatedAt: new Date()
    })
    .where(eq(ticketsRifa.id, id))
    .returning();
  return ticket;
}
// NOVA FUNÇÃO: Deletar ticket
export async function deleteTicket(id: number) {
  await db
    .delete(ticketsRifa)
    .where(eq(ticketsRifa.id, id));
}

// NOVA FUNÇÃO: Buscar alunos da sala
export async function getAlunos(salaId: number) {
  return db
    .select({
      id: usuarios.id,
      nome: usuarios.nome,
      email: usuarios.email,
      celular: usuarios.celular,
      avatarUrl: usuarios.avatarUrl
    })
    .from(usuarios)
    .where(and(
      eq(usuarios.salaId, salaId),
      eq(usuarios.role, "aluno")
    ))
    .orderBy(usuarios.nome);
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
// ---------- EVENTOS ----------
export async function getEventosBySala(salaId: number) {
  return db.select().from(eventos)
    .where(eq(eventos.salaId, salaId))
    .orderBy(desc(eventos.data));
}

export async function createEvento(data: {
  titulo: string;
  descricao?: string | null;
  data: Date;
  local?: string | null;
  tipo?: string;
  status?: "planejado" | "realizado" | "cancelado"; // Tipo específico do enum
  salaId: number;
}) {
  const [ev] = await db.insert(eventos).values({
    titulo: data.titulo,
    descricao: data.descricao || null,
    data: data.data,
    local: data.local || null,
    tipo: data.tipo || "evento",
    status: (data.status || "planejado") as "planejado" | "realizado" | "cancelado", // Cast para o tipo correto
    salaId: data.salaId,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning();
  return ev;
}

export async function updateEvento(id: number, data: Partial<{
  titulo: string;
  descricao: string | null;
  data: Date;
  local: string | null;
  tipo: string;
  status: "planejado" | "realizado" | "cancelado"; // Tipo específico do enum
}>) {
  // Preparar dados para atualização
  const updateData: any = {};
  
  if (data.titulo !== undefined) updateData.titulo = data.titulo;
  if (data.descricao !== undefined) updateData.descricao = data.descricao;
  if (data.data !== undefined) updateData.data = data.data;
  if (data.local !== undefined) updateData.local = data.local;
  if (data.tipo !== undefined) updateData.tipo = data.tipo;
  if (data.status !== undefined) updateData.status = data.status;
  
  updateData.updatedAt = new Date();

  const [ev] = await db
    .update(eventos)
    .set(updateData)
    .where(eq(eventos.id, id))
    .returning();
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