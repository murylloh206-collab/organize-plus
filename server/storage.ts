import { db } from "./db.js";
import {
  usuarios, salas, chaves, rifas, ticketsRifa,
  pagamentos, eventos, metas, caixa,
  type InsertUsuario
} from "../shared/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { hashSenha } from "./auth.js";
import { contribuicoesMeta, historicoMeta } from "../shared/schema.js";

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
    valorArrecadadoRifas: "0"
  }).returning();
  return user;
}

export async function getAlunosBySala(salaId: number) {
  return db.select({
    id: usuarios.id,
    nome: usuarios.nome,
    email: usuarios.email,
    celular: usuarios.celular,
    role: usuarios.role,
    salaId: usuarios.salaId,
    valorArrecadadoRifas: usuarios.valorArrecadadoRifas,
    avatarUrl: usuarios.avatarUrl,
    createdAt: usuarios.createdAt
  }).from(usuarios)
    .where(and(eq(usuarios.salaId, salaId), eq(usuarios.role, "aluno")))
    .orderBy(usuarios.nome);
}

// ---------- Edit dos alunos ----------
export async function updateUser(id: number, data: Partial<{
  nome: string;
  email: string;
  celular: string | null;
  salaId: number | null;
  avatarUrl: string | null;
  valorArrecadadoRifas: string;
}>) {
  const updateData: any = {};
  
  if (data.nome !== undefined) updateData.nome = data.nome;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.celular !== undefined) updateData.celular = data.celular;
  if (data.salaId !== undefined) updateData.salaId = data.salaId;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
  if (data.valorArrecadadoRifas !== undefined) updateData.valorArrecadadoRifas = data.valorArrecadadoRifas;
  
  if (Object.keys(updateData).length === 0) {
    const [user] = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
    return user;
  }
  
  const [user] = await db
    .update(usuarios)
    .set(updateData)
    .where(eq(usuarios.id, id))
    .returning();
  return user;
}

export async function deleteUser(id: number) {
  try {
    console.log(`[Storage.deleteUser] Deletando usuário ID: ${id}`);
    
    // Primeiro deletar tickets associados ao aluno
    await db.delete(ticketsRifa).where(eq(ticketsRifa.vendedorId, id));
    
    // Depois deletar pagamentos associados
    await db.delete(pagamentos).where(eq(pagamentos.usuarioId, id));
    
    // Por fim deletar o usuário
    await db.delete(usuarios).where(eq(usuarios.id, id));
    
    console.log(`[Storage.deleteUser] Usuário ${id} deletado com sucesso`);
  } catch (error) {
    console.error(`[Storage.deleteUser] Erro ao deletar usuário ${id}:`, error);
    throw error;
  }
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
  if (isNaN(id) || id <= 0) {
    return null;
  }
  const [rifa] = await db.select().from(rifas).where(eq(rifas.id, id)).limit(1);
  return rifa;
}

export async function createRifa(data: typeof rifas.$inferInsert) {
  const dadosCompletos = {
    ...data,
    totalNumeros: data.totalNumeros || 200,
    sorteiosRealizados: 0,
    valorArrecadado: "0"
  };
  const [rifa] = await db.insert(rifas).values(dadosCompletos).returning();
  return rifa;
}

export async function updateRifa(id: number, data: Partial<typeof rifas.$inferInsert>) {
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
  await db.delete(ticketsRifa).where(eq(ticketsRifa.rifaId, id));
  await db.delete(rifas).where(eq(rifas.id, id));
}

export async function atualizarValorArrecadadoAluno(alunoId: number) {
  const [result] = await db
    .select({
      total: sql<string>`COALESCE(SUM(valor::numeric), 0)`.as("total"),
    })
    .from(ticketsRifa)
    .where(and(
      eq(ticketsRifa.vendedorId, alunoId),
      eq(ticketsRifa.status, "pago")
    ));
  
  const totalArrecadado = parseFloat(result?.total || "0");
  
  await db
    .update(usuarios)
    .set({ 
      valorArrecadadoRifas: totalArrecadado.toString()
    })
    .where(eq(usuarios.id, alunoId));
}

export async function marcarRifaComoSorteada(id: number, vencedorId: number, numeroSorteado?: number) {
  const [rifa] = await db.select().from(rifas).where(eq(rifas.id, id));
  
  if (!rifa) {
    throw new Error("Rifa não encontrada");
  }
  
  const sorteiosRealizados = (rifa.sorteiosRealizados || 0) + 1;
  
  const [rifaAtualizada] = await db
    .update(rifas)
    .set({ 
      ultimoVencedorId: vencedorId,
      ultimoNumeroSorteado: numeroSorteado,
      ultimoSorteio: new Date(),
      sorteiosRealizados: sorteiosRealizados,
      status: "ativa",
      updatedAt: new Date()
    })
    .where(eq(rifas.id, id))
    .returning();
  
  return rifaAtualizada;
}

// ---------- TICKETS ----------
export async function getTicketsByRifa(rifaId: number) {
  const tickets = await db
    .select({
      id: ticketsRifa.id,
      rifaId: ticketsRifa.rifaId,
      vendedorId: ticketsRifa.vendedorId,
      vendedorNome: usuarios.nome,
      compradorNome: ticketsRifa.compradorNome,
      compradorContato: ticketsRifa.compradorContato,
      valor: ticketsRifa.valor,
      numero: ticketsRifa.numero,
      status: ticketsRifa.status,
      createdAt: ticketsRifa.createdAt,
      updatedAt: ticketsRifa.updatedAt,
    })
    .from(ticketsRifa)
    .leftJoin(usuarios, eq(ticketsRifa.vendedorId, usuarios.id))
    .where(eq(ticketsRifa.rifaId, rifaId))
    .orderBy(ticketsRifa.numero);
  
  return tickets;
}

export async function getTicketsByVendedor(vendedorId: number) {
  return db.select().from(ticketsRifa).where(eq(ticketsRifa.vendedorId, vendedorId)).orderBy(desc(ticketsRifa.createdAt));
}

export async function createTicket(data: typeof ticketsRifa.$inferInsert) {
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

  if (data.status === "pago") {
    await atualizarValorArrecadadoAluno(ticket.vendedorId);
    await atualizarArrecadacaoRifa(ticket.rifaId);
  }

  return ticket;
}

export async function updateTicket(id: number, status: "pago" | "pendente" | "cancelado") {
  console.log(`[Storage.updateTicket] Iniciando atualização do ticket ${id} para status ${status}`);
  
  const [ticketAntigo] = await db
    .select()
    .from(ticketsRifa)
    .where(eq(ticketsRifa.id, id))
    .limit(1);

  if (!ticketAntigo) {
    console.log(`[Storage.updateTicket] Ticket ${id} não encontrado`);
    throw new Error("Ticket não encontrado");
  }
  
  console.log(`[Storage.updateTicket] Ticket antigo: vendedorId=${ticketAntigo.vendedorId}, status=${ticketAntigo.status}, valor=${ticketAntigo.valor}`);

  const [ticket] = await db
    .update(ticketsRifa)
    .set({ 
      status, 
      updatedAt: new Date() 
    })
    .where(eq(ticketsRifa.id, id))
    .returning();

  console.log(`[Storage.updateTicket] Ticket atualizado: status=${ticket.status}`);

  if (ticketAntigo.status !== status) {
    console.log(`[Storage.updateTicket] Status mudou, atualizando valor do vendedor ${ticket.vendedorId}`);
    await atualizarValorArrecadadoAluno(ticket.vendedorId);
  }

  if (status === "pago" && ticketAntigo.status !== "pago") {
    console.log(`[Storage.updateTicket] Ticket agora está pago, atualizando arrecadação da rifa ${ticket.rifaId}`);
    await atualizarArrecadacaoRifa(ticket.rifaId);
  }

  return ticket;
} 

async function atualizarArrecadacaoRifa(rifaId: number) {
  const [result] = await db
    .select({
      total: sql<string>`COALESCE(SUM(valor::numeric), 0)`.as("total"),
    })
    .from(ticketsRifa)
    .where(and(
      eq(ticketsRifa.rifaId, rifaId),
      eq(ticketsRifa.status, "pago")
    ));

  const totalArrecadado = parseFloat(result?.total || "0");

  await db
    .update(rifas)
    .set({ 
      valorArrecadado: totalArrecadado.toString(),
      updatedAt: new Date() 
    })
    .where(eq(rifas.id, rifaId));
}

export async function updateTicketData(id: number, data: {
  compradorNome: string;
  compradorContato: string | null;
  vendedorId: number;
  valor: string;
  status?: "pago" | "pendente" | "cancelado";
}) {
  const [ticketAntigo] = await db
    .select()
    .from(ticketsRifa)
    .where(eq(ticketsRifa.id, id))
    .limit(1);

  if (!ticketAntigo) {
    throw new Error("Ticket não encontrado");
  }

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

  if (ticketAntigo.vendedorId !== data.vendedorId) {
    await atualizarValorArrecadadoAluno(ticketAntigo.vendedorId);
  }
  
  await atualizarValorArrecadadoAluno(data.vendedorId);
  
  if (data.status === "pago" && ticketAntigo.status !== "pago") {
    await atualizarArrecadacaoRifa(ticket.rifaId);
  }

  return ticket;
}

export async function deleteTicket(id: number) {
  try {
    console.log(`[Storage.deleteTicket] Deletando ticket ID: ${id}`);
    
    const [ticket] = await db
      .select()
      .from(ticketsRifa)
      .where(eq(ticketsRifa.id, id))
      .limit(1);

    if (!ticket) {
      console.log(`[Storage.deleteTicket] Ticket ${id} não encontrado`);
      throw new Error("Ticket não encontrado");
    }

    console.log(`[Storage.deleteTicket] Ticket encontrado: vendedorId=${ticket.vendedorId}, rifaId=${ticket.rifaId}`);

    await db
      .delete(ticketsRifa)
      .where(eq(ticketsRifa.id, id));

    // Atualizar valores após deletar
    await atualizarValorArrecadadoAluno(ticket.vendedorId);
    await atualizarArrecadacaoRifa(ticket.rifaId);
    
    console.log(`[Storage.deleteTicket] Ticket ${id} deletado com sucesso`);
    return { success: true };
  } catch (error) {
    console.error(`[Storage.deleteTicket] Erro ao deletar ticket ${id}:`, error);
    throw error;
  }
}

export async function getAlunos(salaId: number) {
  return db
    .select({
      id: usuarios.id,
      nome: usuarios.nome,
      email: usuarios.email,
      celular: usuarios.celular,
      avatarUrl: usuarios.avatarUrl,
      valorArrecadadoRifas: usuarios.valorArrecadadoRifas
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
  return db.select().from(pagamentos)
    .where(eq(pagamentos.usuarioId, usuarioId))
    .orderBy(desc(pagamentos.dataVencimento));
}

export async function getPagamentosPendentes(salaId: number) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  return db.select({
    pagamento: pagamentos,
    usuario: { nome: usuarios.nome, email: usuarios.email, avatarUrl: usuarios.avatarUrl },
  })
    .from(pagamentos)
    .leftJoin(usuarios, eq(pagamentos.usuarioId, usuarios.id))
    .where(and(
      eq(pagamentos.salaId, salaId),
      eq(pagamentos.status, "pendente")
    ))
    .orderBy(pagamentos.dataVencimento);
}

export async function getPagamentoById(id: number) {
  const [pagamento] = await db.select().from(pagamentos)
    .where(eq(pagamentos.id, id))
    .limit(1);
  return pagamento;
}

export async function createPagamento(data: {
  descricao: string;
  valor: string;
  usuarioId: number;
  salaId: number;
  dataVencimento: Date;
  formaPagamento: string;
  status: "pendente" | "pago" | "atrasado";
}) {
  return await db.transaction(async (tx) => {
    const [pagamento] = await tx.insert(pagamentos).values({
      descricao: data.descricao,
      valor: data.valor,
      usuarioId: data.usuarioId,
      salaId: data.salaId,
      dataVencimento: data.dataVencimento,
      formaPagamento: data.formaPagamento,
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    const [aluno] = await tx.select().from(usuarios).where(eq(usuarios.id, data.usuarioId));

    await tx.insert(eventos).values({
      titulo: `📅 Vencimento: ${data.descricao}`,
      descricao: `Pagamento pendente de R$ ${parseFloat(data.valor).toFixed(2)} para ${aluno?.nome}`,
      data: data.dataVencimento,
      tipo: "vencimento",
      status: "planejado",
      salaId: data.salaId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return pagamento;
  });
}

// No storage.ts, atualize a função updatePagamento
export async function updatePagamento(id: number, data: {
  status?: "pendente" | "pago" | "atrasado";
  dataPagamento?: Date;
  formaPagamento?: string;
  comprovanteUrl?: string;
  descricaoPagamento?: string;
  statusComprovante?: "nenhum" | "pendente" | "aprovado" | "rejeitado";
  motivoRejeicao?: string;
  analisadoPor?: number;
  analisadoEm?: Date;
}) {
  const updateData: any = {};
  if (data.status !== undefined) updateData.status = data.status;
  if (data.dataPagamento !== undefined) updateData.dataPagamento = data.dataPagamento;
  if (data.formaPagamento !== undefined) updateData.formaPagamento = data.formaPagamento;
  if (data.comprovanteUrl !== undefined) updateData.comprovanteUrl = data.comprovanteUrl;
  if (data.descricaoPagamento !== undefined) updateData.descricaoPagamento = data.descricaoPagamento;
  if (data.statusComprovante !== undefined) updateData.statusComprovante = data.statusComprovante;
  if (data.motivoRejeicao !== undefined) updateData.motivoRejeicao = data.motivoRejeicao;
  if (data.analisadoPor !== undefined) updateData.analisadoPor = data.analisadoPor;
  if (data.analisadoEm !== undefined) updateData.analisadoEm = data.analisadoEm;
  updateData.updatedAt = new Date();

  const [pagamento] = await db.update(pagamentos)
    .set(updateData)
    .where(eq(pagamentos.id, id))
    .returning();
  
  return pagamento;
}

export async function confirmarPagamentoViaComprovante(
  pagamentoId: number,
  comprovanteUrl: string,
  descricaoPagamento?: string
) {
  return await db.transaction(async (tx) => {
    const [pagamento] = await tx.select().from(pagamentos)
      .where(eq(pagamentos.id, pagamentoId));

    if (!pagamento) {
      throw new Error("Pagamento não encontrado");
    }

    if (pagamento.status === "pago") {
      throw new Error("Este pagamento já foi pago");
    }

    const [atualizado] = await tx.update(pagamentos)
      .set({
        status: "pago",
        dataPagamento: new Date(),
        comprovanteUrl,
        descricaoPagamento: descricaoPagamento || null,
        updatedAt: new Date()
      })
      .where(eq(pagamentos.id, pagamentoId))
      .returning();

    const [evento] = await tx.select().from(eventos)
      .where(and(
        eq(eventos.titulo, `📅 Vencimento: ${pagamento.descricao}`),
        eq(eventos.status, "planejado")
      ))
      .limit(1);

    if (evento) {
      await tx.update(eventos)
        .set({
          status: "realizado",
          descricao: `${evento.descricao} - Pago em ${new Date().toLocaleDateString()}`,
          updatedAt: new Date()
        })
        .where(eq(eventos.id, evento.id));
    }

    return atualizado;
  });
}

export async function deletePagamento(id: number) {
  console.log(`[Storage] Iniciando deleção do pagamento ID: ${id}`);
  
  return await db.transaction(async (tx) => {
    const [pagamento] = await tx.select().from(pagamentos)
      .where(eq(pagamentos.id, id));

    if (!pagamento) {
      console.log(`[Storage] Pagamento ID ${id} não encontrado`);
      throw new Error("Pagamento não encontrado");
    }
    
    console.log(`[Storage] Pagamento encontrado:`, pagamento);

    const [evento] = await tx.select().from(eventos)
      .where(and(
        eq(eventos.titulo, `📅 Vencimento: ${pagamento.descricao}`),
        eq(eventos.tipo, "vencimento")
      ))
      .limit(1);

    if (evento) {
      console.log(`[Storage] Evento relacionado encontrado ID: ${evento.id}, deletando...`);
      await tx.delete(eventos).where(eq(eventos.id, evento.id));
    }

    console.log(`[Storage] Deletando pagamento ID: ${id}`);
    await tx.delete(pagamentos).where(eq(pagamentos.id, id));

    console.log(`[Storage] Pagamento ID ${id} deletado com sucesso`);
    return { success: true, message: "Pagamento deletado com sucesso" };
  });
}

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
  status?: "planejado" | "realizado" | "cancelado";
  salaId: number;
  foto?: string; // ← ADICIONE ESTE CAMPO
}) {
  const [ev] = await db.insert(eventos).values({
    titulo: data.titulo,
    descricao: data.descricao || null,
    data: data.data,
    local: data.local || null,
    tipo: data.tipo || "evento",
    status: (data.status || "planejado") as "planejado" | "realizado" | "cancelado",
    salaId: data.salaId,
    foto: data.foto || null, // ← ADICIONE ESTA LINHA
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
  status: "planejado" | "realizado" | "cancelado";
}>) {
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

export async function getEventosProximos(salaId: number, limit: number = 10) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  return db.select()
    .from(eventos)
    .where(and(
      eq(eventos.salaId, salaId),
      sql`${eventos.data} >= ${hoje.toISOString()}`
    ))
    .orderBy(eventos.data)
    .limit(limit);
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

export async function getMetaById(id: number) {
  const [meta] = await db.select().from(metas).where(eq(metas.id, id)).limit(1);
  return meta;
}

// ---------- CONTRIBUIÇÕES DE METAS ----------
export async function getContribuicoesByMeta(metaId: number) {
  const contribuicoes = await db
    .select({
      id: contribuicoesMeta.id,
      metaId: contribuicoesMeta.metaId,
      alunoId: contribuicoesMeta.alunoId,
      alunoNome: usuarios.nome,
      alunoAvatar: usuarios.avatarUrl,
      valor: contribuicoesMeta.valor,
      descricao: contribuicoesMeta.descricao,
      data: contribuicoesMeta.data,
      createdAt: contribuicoesMeta.createdAt
    })
    .from(contribuicoesMeta)
    .leftJoin(usuarios, eq(contribuicoesMeta.alunoId, usuarios.id))
    .where(eq(contribuicoesMeta.metaId, metaId))
    .orderBy(desc(contribuicoesMeta.data));
  
  return contribuicoes.map(c => ({
    ...c,
    valor: parseFloat(c.valor)
  }));
}

export async function deleteMeta(id: number) {
  return await db.transaction(async (tx) => {
    await tx.delete(contribuicoesMeta)
      .where(eq(contribuicoesMeta.metaId, id));
    
    await tx.delete(historicoMeta)
      .where(eq(historicoMeta.metaId, id));
    
    await tx.delete(metas)
      .where(eq(metas.id, id));
  });
}

export async function createContribuicao(data: {
  metaId: number;
  alunoId: number;
  valor: string;
  descricao?: string;
  createdBy: number;
}) {
  return await db.transaction(async (tx) => {
    const [contrib] = await tx.insert(contribuicoesMeta).values({
      metaId: data.metaId,
      alunoId: data.alunoId,
      valor: data.valor,
      descricao: data.descricao || null,
      data: new Date(),
      createdAt: new Date()
    }).returning();

    const meta = await tx.select().from(metas).where(eq(metas.id, data.metaId)).limit(1);
    if (meta.length > 0) {
      const valorAtual = parseFloat(meta[0].valorAtual || "0") + parseFloat(data.valor);
      await tx.update(metas)
        .set({ 
          valorAtual: valorAtual.toString(),
          updatedAt: new Date() 
        })
        .where(eq(metas.id, data.metaId));
    }

    const [aluno] = await tx.select().from(usuarios).where(eq(usuarios.id, data.alunoId)).limit(1);
    await tx.insert(historicoMeta).values({
      metaId: data.metaId,
      tipo: "update",
      descricao: `Contribuição de R$ ${parseFloat(data.valor).toFixed(2)} adicionada para ${aluno?.nome || 'aluno'}`,
      usuarioId: data.createdBy,
      data: new Date()
    });

    return contrib;
  });
}

export async function updateContribuicao(id: number, data: {
  alunoId?: number;
  valor?: string;
  descricao?: string;
}) {
  return await db.transaction(async (tx) => {
    const [contribOriginal] = await tx.select()
      .from(contribuicoesMeta)
      .where(eq(contribuicoesMeta.id, id))
      .limit(1);

    if (!contribOriginal) {
      throw new Error("Contribuição não encontrada");
    }

    const updateData: any = {};
    if (data.alunoId !== undefined) updateData.alunoId = data.alunoId;
    if (data.valor !== undefined) updateData.valor = data.valor;
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    updateData.updatedAt = new Date();

    const [contrib] = await tx.update(contribuicoesMeta)
      .set(updateData)
      .where(eq(contribuicoesMeta.id, id))
      .returning();

    const todasContribs = await tx.select()
      .from(contribuicoesMeta)
      .where(eq(contribuicoesMeta.metaId, contribOriginal.metaId));

    const novoValorTotal = todasContribs.reduce((sum, c) => sum + parseFloat(c.valor), 0);

    await tx.update(metas)
      .set({ 
        valorAtual: novoValorTotal.toString(),
        updatedAt: new Date() 
      })
      .where(eq(metas.id, contribOriginal.metaId));

    return contrib;
  });
}

export async function deleteContribuicao(id: number) {
  return await db.transaction(async (tx) => {
    const [contrib] = await tx.select()
      .from(contribuicoesMeta)
      .where(eq(contribuicoesMeta.id, id))
      .limit(1);

    if (!contrib) {
      throw new Error("Contribuição não encontrada");
    }

    await tx.delete(contribuicoesMeta)
      .where(eq(contribuicoesMeta.id, id));

    const todasContribs = await tx.select()
      .from(contribuicoesMeta)
      .where(eq(contribuicoesMeta.metaId, contrib.metaId));

    const novoValorTotal = todasContribs.reduce((sum, c) => sum + parseFloat(c.valor), 0);

    await tx.update(metas)
      .set({ 
        valorAtual: novoValorTotal.toString(),
        updatedAt: new Date() 
      })
      .where(eq(metas.id, contrib.metaId));

    const [admin] = await tx.select().from(usuarios).where(eq(usuarios.id, 1)).limit(1);
    await tx.insert(historicoMeta).values({
      metaId: contrib.metaId,
      tipo: "edit",
      descricao: `Contribuição de R$ ${parseFloat(contrib.valor).toFixed(2)} removida`,
      usuarioId: admin?.id || 1,
      data: new Date()
    });
  });
}

// ---------- HISTÓRICO DE METAS ----------
export async function getHistoricoByMeta(metaId: number) {
  const historico = await db
    .select({
      id: historicoMeta.id,
      metaId: historicoMeta.metaId,
      tipo: historicoMeta.tipo,
      descricao: historicoMeta.descricao,
      usuarioNome: usuarios.nome,
      data: historicoMeta.data
    })
    .from(historicoMeta)
    .leftJoin(usuarios, eq(historicoMeta.usuarioId, usuarios.id))
    .where(eq(historicoMeta.metaId, metaId))
    .orderBy(desc(historicoMeta.data));
  
  return historico;
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
// ---------- DASHBOARD STATS ----------
export async function getDashboardStats(salaId: number) {
  console.log("=== DEBUG DASHBOARD ===");
  console.log("salaId:", salaId);
  
  // Soma pagamentos
  const [pagsResult] = await db
    .select({
      total: sql<string>`SUM(CASE WHEN LOWER(status::text) = 'pago' THEN valor::numeric ELSE 0 END)`.as("total"),
    })
    .from(pagamentos)
    .where(eq(pagamentos.salaId, salaId));
  
  console.log("Pagamentos result:", pagsResult);
  
  // Contagem de alunos
  const [alunosResult] = await db
    .select({ count: sql<string>`COUNT(*)`.as("count") })
    .from(usuarios)
    .where(and(eq(usuarios.salaId, salaId), eq(usuarios.role, "aluno")));
  
  console.log("Alunos result:", alunosResult);
  
  // Teste direto: buscar todos os tickets pagos
  const ticketsPagos = await db
    .select({
      id: ticketsRifa.id,
      valor: ticketsRifa.valor,
      status: ticketsRifa.status,
      rifaId: ticketsRifa.rifaId,
    })
    .from(ticketsRifa)
    .innerJoin(rifas, eq(ticketsRifa.rifaId, rifas.id))
    .where(and(
      eq(rifas.salaId, salaId),
      eq(ticketsRifa.status, "pago")
    ));
  
  console.log("Tickets pagos (comparação direta):", ticketsPagos);
  
  // Calcular total manualmente
  let totalRifasManual = 0;
  for (const t of ticketsPagos) {
    totalRifasManual += parseFloat(t.valor);
  }
  console.log("Total rifas manual:", totalRifasManual);
  
  // Usar a query com LOWER::text
  const [rifasResult] = await db
    .select({
      total: sql<string>`COALESCE(SUM(t.valor::numeric), 0)`.as("total"),
    })
    .from(ticketsRifa)
    .innerJoin(rifas, eq(ticketsRifa.rifaId, rifas.id))
    .where(and(
      eq(rifas.salaId, salaId),
      sql`LOWER(${ticketsRifa.status}::text) = 'pago'`
    ));
  
  console.log("Rifas result (com LOWER):", rifasResult);
  console.log("Total rifas LOWER:", parseFloat(rifasResult?.total ?? "0"));

  // Contagem total de tickets
  const [ticketsResult] = await db
    .select({ count: sql<string>`COUNT(*)`.as("count") })
    .from(ticketsRifa)
    .innerJoin(rifas, eq(ticketsRifa.rifaId, rifas.id))
    .where(eq(rifas.salaId, salaId));

  const saldo = await getSaldoCaixa(salaId);

  const totalPagamentos = parseFloat(pagsResult?.total ?? "0");
  const totalRifas = parseFloat(rifasResult?.total ?? "0");

  console.log("Total Pagamentos:", totalPagamentos);
  console.log("Total Rifas:", totalRifas);
  console.log("Total Arrecadado:", totalPagamentos + totalRifas);

  return {
    totalArrecadado: totalPagamentos + totalRifas,
    totalAlunos: parseInt(alunosResult?.count ?? "0"),
    totalTickets: parseInt(ticketsResult?.count ?? "0"),
    saldoCaixa: saldo,
  };
}

// Aprovar comprovante
export async function aprovarComprovante(pagamentoId: number, analisadoPor: number) {
  return await db.transaction(async (tx) => {
    const [pagamento] = await tx.select().from(pagamentos)
      .where(eq(pagamentos.id, pagamentoId));
    
    if (!pagamento) {
      throw new Error("Pagamento não encontrado");
    }
    
    if (pagamento.statusComprovante !== "pendente") {
      throw new Error("Não há comprovante pendente para aprovação");
    }
    
    // Atualiza pagamento
    const [atualizado] = await tx.update(pagamentos)
      .set({
        status: "pago",
        statusComprovante: "aprovado",
        dataPagamento: new Date(),
        analisadoPor,
        analisadoEm: new Date(),
        updatedAt: new Date()
      })
      .where(eq(pagamentos.id, pagamentoId))
      .returning();
    
    // Atualiza evento relacionado
    const [evento] = await tx.select().from(eventos)
      .where(and(
        eq(eventos.titulo, `📅 Vencimento: ${pagamento.descricao}`),
        eq(eventos.status, "planejado")
      ))
      .limit(1);
    
    if (evento) {
      await tx.update(eventos)
        .set({
          status: "realizado",
          descricao: `${evento.descricao} - Pago em ${new Date().toLocaleDateString()}`,
          updatedAt: new Date()
        })
        .where(eq(eventos.id, evento.id));
    }
    
    return atualizado;
  });
}

// Rejeitar comprovante
export async function rejeitarComprovante(pagamentoId: number, analisadoPor: number, motivo: string) {
  const [atualizado] = await db.update(pagamentos)
    .set({
      statusComprovante: "rejeitado",
      motivoRejeicao: motivo,
      analisadoPor,
      analisadoEm: new Date(),
      updatedAt: new Date()
    })
    .where(eq(pagamentos.id, pagamentoId))
    .returning();
  
  return atualizado;
}

// Buscar pagamentos com comprovante pendente
export async function getPagamentosComComprovantePendente(salaId: number) {
  return db.select({
    pagamento: pagamentos,
    usuario: { nome: usuarios.nome, email: usuarios.email, avatarUrl: usuarios.avatarUrl },
  })
    .from(pagamentos)
    .leftJoin(usuarios, eq(pagamentos.usuarioId, usuarios.id))
    .where(and(
      eq(pagamentos.salaId, salaId),
      eq(pagamentos.statusComprovante, "pendente")
    ))
    .orderBy(pagamentos.createdAt);
}