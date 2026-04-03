import { supabaseAdmin } from "./db.js";
import { hashSenha } from "./auth.js";
import type { 
  Usuario, Sala, Rifa, TicketRifa, Pagamento, Evento, Meta, 
  CaixaMovimento, Notificacao, ContribuicaoMeta, HistoricoMeta
} from "../shared/schema.js";

// ---------- HELPERS ----------
function safeArray(data: any[] | null): any[] {
  return data && Array.isArray(data) ? data : [];
}

// ---------- USUARIOS ----------
export async function getUserById(id: number) {
  const { data, error } = await supabaseAdmin.from("usuarios").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin.from("usuarios").select("*").eq("email", email).single();
  if (error) return null;
  return data;
}

export async function createUser(data: { nome: string; email: string; senha?: string; role?: "admin" | "aluno"; salaId?: number; celular?: string; }) {
  const senhaHash = data.senha ? await hashSenha(data.senha) : "";
  const { data: user, error } = await supabaseAdmin.from("usuarios").insert({
    nome: data.nome,
    email: data.email,
    senha_hash: senhaHash,
    celular: data.celular || null,
    role: data.role || "aluno",
    sala_id: data.salaId || null,
    valor_arrecadado_rifas: "0"
  }).select().single();
  
  if (error) throw new Error(error.message);
  return user;
}

export async function updateUser(id: number, data: any) {
  const { data: user, error } = await supabaseAdmin.from("usuarios").update({
    nome: data.nome,
    email: data.email,
    celular: data.celular,
    sala_id: data.salaId,
    avatar_url: data.avatarUrl,
    valor_arrecadado_rifas: data.valorArrecadadoRifas,
    meta_individual: data.metaIndividual
  }).eq("id", id).select().single();
  
  if (error) throw new Error(error.message);
  return user;
}

export async function deleteUser(id: number) {
  await supabaseAdmin.from("tickets_rifa").delete().eq("vendedor_id", id);
  await supabaseAdmin.from("pagamentos").delete().eq("usuario_id", id);
  const { error } = await supabaseAdmin.from("usuarios").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getAlunosBySala(salaId: number) {
  const { data, error } = await supabaseAdmin.from("usuarios")
    .select("*")
    .eq("sala_id", salaId)
    .eq("role", "aluno")
    .order("nome", { ascending: true });
  
  return error ? [] : safeArray(data).map(u => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    celular: u.celular,
    role: u.role,
    salaId: u.sala_id,
    valorArrecadadoRifas: u.valor_arrecadado_rifas,
    avatarUrl: u.avatar_url,
    createdAt: u.created_at
  }));
}

// ---------- SALAS ----------
export async function getSalaById(id: number) {
  const { data, error } = await supabaseAdmin.from("salas").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

export async function createSala(data: { nome: string; codigo: string; dataFormatura?: string; metaValor?: number; senha?: string }) {
  const { data: sala, error } = await supabaseAdmin.from("salas").insert({
    nome: data.nome,
    codigo: data.codigo,
    data_formatura: data.dataFormatura || null,
    meta_valor: (data.metaValor || 0).toString(),
    senha: data.senha || null
  }).select().single();

  if (error) throw new Error(error.message);
  return sala;
}

export async function updateSala(id: number, data: any) {
  const updateData: any = {};
  if (data.nome !== undefined) updateData.nome = data.nome;
  if (data.metaValor !== undefined) updateData.meta_valor = data.metaValor.toString();
  if (data.senha !== undefined) updateData.senha = data.senha;

  const { data: sala, error } = await supabaseAdmin.from("salas").update(updateData).eq("id", id).select().single();
  if (error) throw new Error(error.message);

  if (data.metaValor !== undefined) {
    await recalcularCotasPorSala(id);
  }
  return sala;
}

export async function deleteSala(id: number) {
  // Cascading deletes handled roughly or via RLS/triggers ideally, but we'll try API
  await supabaseAdmin.from("usuarios").delete().eq("sala_id", id);
  await supabaseAdmin.from("salas").delete().eq("id", id);
}

export async function recalcularCotasPorSala(salaId: number) {
  const sala = await getSalaById(salaId);
  if (!sala) return;

  const { data: alunos } = await supabaseAdmin.from("usuarios").select("id").eq("sala_id", salaId).eq("role", "aluno");
  if (!alunos || alunos.length === 0) return;

  const metaValor = parseFloat(sala.meta_valor || "0");
  const cotaPorAluno = (metaValor / alunos.length).toFixed(2);

  await supabaseAdmin.from("usuarios").update({ meta_individual: cotaPorAluno }).eq("sala_id", salaId).eq("role", "aluno");
  await criarNotificacaoCotaRecalculada(salaId, cotaPorAluno);
}

// ---------- RIFAS ----------
export async function getRifasBySala(salaId: number) {
  const { data, error } = await supabaseAdmin.from("rifas").select("*").eq("sala_id", salaId).order("created_at", { ascending: false });
  return error ? [] : safeArray(data);
}

export async function getRifaById(id: number) {
  const { data, error } = await supabaseAdmin.from("rifas").select("*").eq("id", id).single();
  return error ? null : data;
}

export async function createRifa(data: any) {
  const { data: rifa, error } = await supabaseAdmin.from("rifas").insert({
    sala_id: data.salaId,
    nome: data.nome,
    descricao: data.descricao,
    preco: (data.preco || 0).toString(),
    premio: data.premio,
    total_numeros: data.totalNumeros || 200,
    status: data.status || "ativa",
    valor_arrecadado: "0",
    sorteios_realizados: 0
  }).select().single();
  
  if (error) throw new Error(error.message);
  return rifa;
}

export async function updateRifa(id: number, data: any) {
  const { data: rifa, error } = await supabaseAdmin.from("rifas").update({
    nome: data.nome,
    descricao: data.descricao,
    premio: data.premio,
    status: data.status,
    total_numeros: data.totalNumeros,
    updated_at: new Date().toISOString()
  }).eq("id", id).select().single();

  if (error) throw new Error(error.message);
  return rifa;
}

export async function deleteRifa(id: number) {
  await supabaseAdmin.from("tickets_rifa").delete().eq("rifa_id", id);
  await supabaseAdmin.from("rifas").delete().eq("id", id);
}

export async function getTicketsByRifa(rifaId: number) {
  const { data, error } = await supabaseAdmin.from("tickets_rifa")
    .select("*, vendedor:usuarios!vendedor_id(nome)")
    .eq("rifa_id", rifaId)
    .order("numero", { ascending: true });
    
  return error ? [] : safeArray(data).map(t => ({ // Mapeando as colunas para o JS 
    ...t, 
    vendedorNome: t.vendedor?.nome, 
    rifaId: t.rifa_id, 
    vendedorId: t.vendedor_id, 
    compradorNome: t.comprador_nome, 
    compradorContato: t.comprador_contato 
  }));
}

export async function getTicketsByVendedor(vendedorId: number) {
  const { data, error } = await supabaseAdmin.from("tickets_rifa").select("*").eq("vendedor_id", vendedorId).order("created_at", { ascending: false });
  return error ? [] : safeArray(data);
}

export async function createTicket(data: any) {
  const { data: check } = await supabaseAdmin.from("tickets_rifa").select("id").eq("rifa_id", data.rifaId).eq("numero", data.numero);
  if (check && check.length > 0) throw new Error("Número já está ocupado");

  const { data: ticket, error } = await supabaseAdmin.from("tickets_rifa").insert({
    rifa_id: data.rifaId,
    vendedor_id: data.vendedorId,
    comprador_nome: data.compradorNome,
    comprador_contato: data.compradorContato,
    valor: data.valor.toString(),
    numero: data.numero,
    status: data.status || "pendente"
  }).select().single();

  if (error) throw new Error(error.message);

  if (ticket.status === "pago") {
    await atualizarValorArrecadadoAluno(ticket.vendedor_id);
    await atualizarArrecadacaoRifa(ticket.rifa_id);
  }
  return ticket;
}

export async function updateTicket(id: number, status: string) {
  const { data: old } = await supabaseAdmin.from("tickets_rifa").select("*").eq("id", id).single();
  if (!old) throw new Error("Ticket não encontrado");

  const { data: ticket, error } = await supabaseAdmin.from("tickets_rifa").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) throw new Error(error.message);

  if (old.status !== status) {
    await atualizarValorArrecadadoAluno(ticket.vendedor_id);
    if (status === "pago") await atualizarArrecadacaoRifa(ticket.rifa_id);
  }
  return ticket;
}

export async function updateTicketData(id: number, data: any) {
  const { data: old } = await supabaseAdmin.from("tickets_rifa").select("*").eq("id", id).single();
  if (!old) throw new Error("Ticket não encontrado");

  const { data: ticket, error } = await supabaseAdmin.from("tickets_rifa").update({
    comprador_nome: data.compradorNome,
    comprador_contato: data.compradorContato,
    vendedor_id: data.vendedorId,
    valor: data.valor,
    status: data.status || "pendente",
    updated_at: new Date().toISOString()
  }).eq("id", id).select().single();

  if (error) throw new Error(error.message);
  await atualizarValorArrecadadoAluno(old.vendedor_id);
  if (old.vendedor_id !== ticket.vendedor_id) await atualizarValorArrecadadoAluno(ticket.vendedor_id);
  await atualizarArrecadacaoRifa(ticket.rifa_id);
  return ticket;
}

export async function deleteTicket(id: number) {
  const { data: ticket } = await supabaseAdmin.from("tickets_rifa").select("*").eq("id", id).single();
  if (!ticket) throw new Error("Ticket não encontrado");

  await supabaseAdmin.from("tickets_rifa").delete().eq("id", id);
  await atualizarValorArrecadadoAluno(ticket.vendedor_id);
  await atualizarArrecadacaoRifa(ticket.rifa_id);
  return { success: true };
}

export async function atualizarValorArrecadadoAluno(alunoId: number) {
  const { data } = await supabaseAdmin.from("tickets_rifa").select("valor").eq("vendedor_id", alunoId).eq("status", "pago");
  const val = data ? data.reduce((sum, item) => sum + parseFloat(item.valor || "0"), 0) : 0;
  await supabaseAdmin.from("usuarios").update({ valor_arrecadado_rifas: val.toString() }).eq("id", alunoId);
}

export async function atualizarArrecadacaoRifa(rifaId: number) {
  const { data } = await supabaseAdmin.from("tickets_rifa").select("valor").eq("rifa_id", rifaId).eq("status", "pago");
  const val = data ? data.reduce((sum, item) => sum + parseFloat(item.valor || "0"), 0) : 0;
  await supabaseAdmin.from("rifas").update({ valor_arrecadado: val.toString() }).eq("id", rifaId);
}

export async function marcarRifaComoSorteada(id: number, vencedorId: number, numeroSorteado?: number) {
  const rifa = await getRifaById(id);
  if (!rifa) throw new Error("Rifa nÃ£o encontrada");
  const nrSorteios = (rifa.sorteios_realizados || 0) + 1;
  const { data } = await supabaseAdmin.from("rifas").update({
    ultimo_vencedor_id: vencedorId,
    ultimo_numero_sorteado: numeroSorteado,
    status: "ativa",
    sorteios_realizados: nrSorteios,
    ultimo_sorteio: new Date().toISOString()
  }).eq("id", id).select().single();
  return data;
}

// ---------- PAGAMENTOS ----------
export async function getPagamentosBySala(salaId: number) {
  const { data, error } = await supabaseAdmin.from("pagamentos").select("*, usuario:usuarios!usuario_id(id, nome, email, avatar_url)").eq("sala_id", salaId).order("created_at", { ascending: false });
  return error ? [] : safeArray(data).map(p => ({
    pagamento: p, usuario: p.usuario
  }));
}

export async function getPagamentosByUsuario(usuarioId: number) {
  const { data, error } = await supabaseAdmin.from("pagamentos").select("*").eq("usuario_id", usuarioId).order("data_vencimento", { ascending: false });
  return error ? [] : safeArray(data);
}

export async function createPagamento(data: any) {
  const { data: pagamento, error } = await supabaseAdmin.from("pagamentos").insert({
    descricao: data.descricao,
    valor: data.valor,
    usuario_id: data.usuarioId,
    sala_id: data.salaId,
    data_vencimento: data.dataVencimento,
    forma_pagamento: data.formaPagamento,
    status: data.status
  }).select().single();

  if (error) throw new Error(error.message);
  
  const { data: aluno } = await supabaseAdmin.from("usuarios").select("nome").eq("id", data.usuarioId).single();
  await supabaseAdmin.from("eventos").insert({
    titulo: `📅 Vencimento: ${data.descricao}`,
    descricao: `Pagamento pendente de R$ ${parseFloat(data.valor).toFixed(2)} para ${aluno?.nome || ''}`,
    data: data.dataVencimento,
    tipo: "vencimento",
    sala_id: data.salaId,
    status: "planejado"
  });

  return pagamento;
}

export async function updatePagamento(id: number, data: any) {
  const up: any = {};
  if (data.status) up.status = data.status;
  if (data.dataPagamento) up.data_pagamento = data.dataPagamento;
  if (data.formaPagamento) up.forma_pagamento = data.formaPagamento;
  if (data.comprovanteUrl !== undefined) up.comprovante_url = data.comprovanteUrl;
  if (data.descricaoPagamento) up.descricao_pagamento = data.descricaoPagamento;
  if (data.statusComprovante) up.status_comprovante = data.statusComprovante;
  if (data.motivoRejeicao !== undefined) up.motivo_rejeicao = data.motivoRejeicao;
  if (data.analisadoPor) up.analisado_por = data.analisadoPor;
  if (data.analisadoEm) up.analisado_em = data.analisadoEm;
  up.updated_at = new Date().toISOString();

  const { data: result, error } = await supabaseAdmin.from("pagamentos").update(up).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return result;
}

export async function deletePagamento(id: number) {
  await supabaseAdmin.from("pagamentos").delete().eq("id", id);
  return { success: true };
}

export async function aprovarComprovante(pagamentoId: number, analisadoPor: number) {
  const p = await updatePagamento(pagamentoId, {
    status: "pago",
    statusComprovante: "aprovado",
    dataPagamento: new Date().toISOString(),
    analisadoPor,
    analisadoEm: new Date().toISOString()
  });
  return p;
}

export async function rejeitarComprovante(pagamentoId: number, analisadoPor: number, motivo: string) {
  return await updatePagamento(pagamentoId, {
    statusComprovante: "rejeitado",
    motivoRejeicao: motivo,
    analisadoPor,
    analisadoEm: new Date().toISOString()
  });
}

export async function getPagamentosComComprovantePendente(salaId: number) {
  const { data } = await supabaseAdmin.from("pagamentos").select("*, usuario:usuarios!usuario_id(id, nome, email, avatar_url)").eq("sala_id", salaId).eq("status_comprovante", "pendente").order("created_at", { ascending: true });
  return safeArray(data).map(p => ({
    pagamento: p, usuario: p.usuario
  }));
}

export async function getPagamentosPendentes(salaId: number) {
  const { data } = await supabaseAdmin.from("pagamentos").select("*, usuario:usuarios!usuario_id(id, nome, email, avatar_url)").eq("sala_id", salaId).eq("status", "pendente").order("data_vencimento", { ascending: true });
  return safeArray(data).map(p => ({ pagamento: p, usuario: p.usuario }));
}

// ---------- EVENTOS ----------
export async function getEventosBySala(salaId: number) {
  const { data, error } = await supabaseAdmin.from("eventos").select("*").eq("sala_id", salaId).order("data", { ascending: false });
  return error ? [] : safeArray(data);
}

export async function createEvento(data: any) {
  const { data: ev, error } = await supabaseAdmin.from("eventos").insert({
    titulo: data.titulo,
    descricao: data.descricao,
    data: data.data,
    local: data.local,
    tipo: data.tipo || "evento",
    status: data.status || "planejado",
    sala_id: data.salaId,
    foto: data.foto
  }).select().single();
  if (error) throw new Error(error.message);
  return ev;
}

export async function updateEvento(id: number, data: any) {
  const { data: ev, error } = await supabaseAdmin.from("eventos").update(data).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return ev;
}

export async function deleteEvento(id: number) {
  await supabaseAdmin.from("eventos").delete().eq("id", id);
}

export async function getEventosProximos(salaId: number, limit = 10) {
  const hoje = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  const { data } = await supabaseAdmin.from("eventos").select("*").eq("sala_id", salaId).gte("data", hoje).order("data", { ascending: true }).limit(limit);
  return safeArray(data);
}

// ---------- METAS ----------
export async function getMetasBySala(salaId: number) {
  const { data, error } = await supabaseAdmin.from("metas").select("*").eq("sala_id", salaId);
  return error ? [] : safeArray(data);
}

export async function getMetaById(id: number) {
  const { data } = await supabaseAdmin.from("metas").select("*").eq("id", id).single();
  return data;
}

export async function createMeta(data: any) {
  const { data: m, error } = await supabaseAdmin.from("metas").insert({
    sala_id: data.salaId,
    titulo: data.titulo,
    descricao: data.descricao,
    valor_meta: data.valorMeta,
    valor_atual: data.valor_atual || "0"
  }).select().single();
  if (error) throw new Error(error.message);
  return m;
}

export async function updateMeta(id: number, data: any) {
  const { data: m, error } = await supabaseAdmin.from("metas").update({
    titulo: data.titulo,
    descricao: data.descricao,
    valor_meta: data.valorMeta,
    valor_atual: data.valorAtual,
    updated_at: new Date().toISOString()
  }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return m;
}

export async function deleteMeta(id: number) {
  await supabaseAdmin.from("contribuicoes_meta").delete().eq("meta_id", id);
  await supabaseAdmin.from("historico_meta").delete().eq("meta_id", id);
  await supabaseAdmin.from("metas").delete().eq("id", id);
}

export async function getContribuicoesByMeta(metaId: number) {
  const { data } = await supabaseAdmin.from("contribuicoes_meta").select("*, aluno:usuarios!aluno_id(nome, avatar_url)").eq("meta_id", metaId).order("data", { ascending: false });
  return safeArray(data).map(c => ({
    ...c,
    metaId: c.meta_id,
    alunoId: c.aluno_id,
    alunoNome: c.aluno?.nome,
    alunoAvatar: c.aluno?.avatar_url,
    createdAt: c.created_at
  }));
}

export async function createContribuicao(data: any) {
  const { data: c, error } = await supabaseAdmin.from("contribuicoes_meta").insert({
    meta_id: data.metaId,
    aluno_id: data.alunoId,
    valor: data.valor,
    descricao: data.descricao,
    data: new Date().toISOString()
  }).select().single();
  
  if (error) throw new Error(error.message);
  
  // Atualiza valor atual da meta
  const { data: cont } = await supabaseAdmin.from("contribuicoes_meta").select("valor").eq("meta_id", data.metaId);
  const total = cont?.reduce((s, x) => s + parseFloat(x.valor), 0) || 0;
  await supabaseAdmin.from("metas").update({ valor_atual: total.toString() }).eq("id", data.metaId);

  return c;
}

export async function updateContribuicao(id: number, data: any) {
  const { data: old } = await supabaseAdmin.from("contribuicoes_meta").select("*").eq("id", id).single();
  if (!old) throw new Error("Contribuição não encontrada");

  await supabaseAdmin.from("contribuicoes_meta").update({
    aluno_id: data.alunoId,
    valor: data.valor,
    descricao: data.descricao,
    updated_at: new Date().toISOString()
  }).eq("id", id);

  const { data: cont } = await supabaseAdmin.from("contribuicoes_meta").select("valor").eq("meta_id", old.meta_id);
  const total = cont?.reduce((s, x) => s + parseFloat(x.valor), 0) || 0;
  await supabaseAdmin.from("metas").update({ valor_atual: total.toString() }).eq("id", old.meta_id);
  
  return { id };
}

export async function deleteContribuicao(id: number) {
  const { data: old } = await supabaseAdmin.from("contribuicoes_meta").select("*").eq("id", id).single();
  if (!old) return;

  await supabaseAdmin.from("contribuicoes_meta").delete().eq("id", id);
  
  const { data: cont } = await supabaseAdmin.from("contribuicoes_meta").select("valor").eq("meta_id", old.meta_id);
  const total = cont?.reduce((s, x) => s + parseFloat(x.valor), 0) || 0;
  await supabaseAdmin.from("metas").update({ valor_atual: total.toString() }).eq("id", old.meta_id);
}

export async function getHistoricoByMeta(metaId: number) {
  const { data } = await supabaseAdmin.from("historico_meta").select("*, usuario:usuarios!usuario_id(nome)").eq("meta_id", metaId).order("data", { ascending: false });
  return safeArray(data).map(h => ({
    ...h,
    metaId: h.meta_id,
    usuarioNome: h.usuario?.nome
  }));
}

// ---------- CAIXA ----------
export async function getCaixaBySala(salaId: number) {
  const { data, error } = await supabaseAdmin.from("caixa").select("*, usuario:usuarios!created_by(nome)").eq("sala_id", salaId).order("data", { ascending: false });
  return error ? [] : safeArray(data).map(c => ({
    mov: c, usuario: c.usuario
  }));
}

export async function createMovimento(data: any) {
  const { data: mov, error } = await supabaseAdmin.from("caixa").insert({
    sala_id: data.salaId,
    descricao: data.descricao,
    tipo: data.tipo,
    valor: data.valor,
    categoria: data.categoria,
    created_by: data.createdBy,
    data: new Date().toISOString()
  }).select().single();
  if (error) throw new Error(error.message);
  return mov;
}

export async function getSaldoCaixa(salaId: number) {
  const { data } = await supabaseAdmin.from("caixa").select("tipo, valor").eq("sala_id", salaId);
  if (!data) return 0;
  return data.reduce((acc, mov) => acc + (mov.tipo === "entrada" ? parseFloat(mov.valor) : -parseFloat(mov.valor)), 0);
}

// ---------- NOTIFICAÇÕES ----------
export async function getNotificacoesByAluno(alunoId: number, limit = 20) {
  const { data } = await supabaseAdmin.from("notificacoes").select("*").eq("aluno_id", alunoId).order("created_at", { ascending: false }).limit(limit);
  return safeArray(data);
}

export async function getNotificacaoCountNaoLidas(alunoId: number) {
  const { count } = await supabaseAdmin.from("notificacoes").select("*", { count: "exact", head: true }).eq("aluno_id", alunoId).eq("lida", false);
  return count || 0;
}

export async function createNotificacao(data: any) {
  const { data: notif } = await supabaseAdmin.from("notificacoes").insert({
    aluno_id: data.alunoId,
    titulo: data.titulo,
    mensagem: data.mensagem,
    tipo: data.tipo || 'sistema'
  }).select().single();
  return notif;
}

export async function marcarNotificacaoComoLida(id: number) {
  const { data } = await supabaseAdmin.from("notificacoes").update({ lida: true }).eq("id", id).select().single();
  return data;
}

export async function marcarTodasNotificacoesComoLidas(alunoId: number) {
  await supabaseAdmin.from("notificacoes").update({ lida: true }).eq("aluno_id", alunoId).eq("lida", false);
}

export async function criarNotificacaoCotaRecalculada(salaId: number, novaCota: string) {
  const { data: alunos } = await supabaseAdmin.from("usuarios").select("id").eq("sala_id", salaId).eq("role", "aluno");
  if (!alunos) return;
  const valorFormatado = parseFloat(novaCota).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  
  for (const aluno of alunos) {
    await createNotificacao({
      alunoId: aluno.id,
      titulo: "Cota Recalculada",
      mensagem: `Sua cota individual foi atualizada para ${valorFormatado} devido a uma mudança na turma.`,
      tipo: "sistema"
    });
  }
}

// ---------- CHAVES ----------
export async function getChaveByCode(chave: string) {
  const { data } = await supabaseAdmin.from("chaves").select("*").eq("chave", chave).single();
  return data;
}

export async function marcarChaveUsada(chaveId: number, usuarioId: number) {
  await supabaseAdmin.from("chaves").update({ ativa: false, usada_por: usuarioId }).eq("id", chaveId);
}

// ---------- DASHBOARD STATS ----------
export async function getDashboardStats(salaId: number) {
  // Pags pagos
  const { data: pags } = await supabaseAdmin.from("pagamentos").select("valor").eq("sala_id", salaId).eq("status", "pago");
  const totalPags = pags?.reduce((s, p) => s + parseFloat(p.valor), 0) || 0;

  // Rifas pagas
  const { data: rifas } = await supabaseAdmin.from("rifas").select("id").eq("sala_id", salaId);
  let totalRifas = 0;
  let totalTickets = 0;
  if (rifas && rifas.length > 0) {
    const rifaIds = rifas.map(r => r.id);
    const { data: tickets } = await supabaseAdmin.from("tickets_rifa").select("valor, status").in("rifa_id", rifaIds);
    if (tickets) {
      totalTickets = tickets.length;
      totalRifas = tickets.filter(t => t.status === "pago").reduce((s, t) => s + parseFloat(t.valor), 0);
    }
  }

  // Alunos
  const { count: totalAlunos } = await supabaseAdmin.from("usuarios").select("*", { count: "exact", head: true }).eq("sala_id", salaId).eq("role", "aluno");

  const saldoCaixa = await getSaldoCaixa(salaId);

  return {
    totalArrecadado: totalPags + totalRifas,
    totalAlunos: totalAlunos || 0,
    totalTickets: totalTickets,
    saldoCaixa: saldoCaixa
  };
}

// ---------- DASHBOARD DO ALUNO ----------
export async function getAlunoDashboardStats(alunoId: number, salaId: number) {
  const { data: aluno } = await supabaseAdmin.from("usuarios").select("meta_individual, valor_arrecadado_rifas, nome, avatar_url").eq("id", alunoId).single();
  const metaIndividual = parseFloat(aluno?.meta_individual || "0");

  const { data: pags } = await supabaseAdmin.from("pagamentos").select("valor, status").eq("usuario_id", alunoId);
  const totalPago = pags?.filter(p => p.status === "pago").reduce((s, p) => s + parseFloat(p.valor), 0) || 0;
  const totalPendente = pags?.filter(p => p.status === "pendente").reduce((s, p) => s + parseFloat(p.valor), 0) || 0;

  const { data: tickets } = await supabaseAdmin.from("tickets_rifa").select("valor, status").eq("vendedor_id", alunoId);
  const totalVendido = tickets?.filter(t => t.status === "pago").reduce((s, t) => s + parseFloat(t.valor), 0) || 0;
  const totalTickets = tickets?.length || 0;

  const saldoCaixa = await getSaldoCaixa(salaId);

  const salaInfo = await getSalaById(salaId);
  const metaSala = parseFloat(salaInfo?.meta_valor || "0");

  const adminStats = await getDashboardStats(salaId);
  const totalArrecadadoSala = adminStats.totalArrecadado;
  
  return {
    aluno: {
      nome: aluno?.nome || "",
      avatarUrl: aluno?.avatar_url,
      metaIndividual
    },
    pagamentos: {
      totalPago,
      totalPendente,
      percentualPago: metaIndividual > 0 ? Math.round((totalPago / metaIndividual) * 100) : 0
    },
    rifas: {
      totalVendido,
      totalTickets,
      metaRifas: metaIndividual * 0.1
    },
    sala: {
      metaTotal: metaSala,
      totalArrecadado: totalArrecadadoSala,
      saldoCaixa,
      totalAlunos: adminStats.totalAlunos,
      percentualMeta: metaSala > 0 ? Math.round((totalArrecadadoSala / metaSala) * 100) : 0
    }
  };
}
// ========== FUNÇÕES ADICIONAIS PARA PAGAMENTOS ==========

export async function confirmarPagamentoViaComprovante(
  pagamentoId: number,
  comprovanteUrl: string,
  descricaoPagamento?: string
) {
  try {
    // Buscar pagamento atual
    const { data: pagamento, error: findError } = await supabaseAdmin
      .from("pagamentos")
      .select("*")
      .eq("id", pagamentoId)
      .single();
    
    if (findError || !pagamento) {
      throw new Error("Pagamento não encontrado");
    }

    if (pagamento.status === "pago") {
      throw new Error("Este pagamento já foi pago");
    }

    // Atualizar pagamento
    const { data, error } = await supabaseAdmin
      .from("pagamentos")
      .update({
        status: "pago",
        data_pagamento: new Date().toISOString(),
        comprovante_url: comprovanteUrl,
        descricao_pagamento: descricaoPagamento || null,
        status_comprovante: "aprovado",
        updated_at: new Date().toISOString()
      })
      .eq("id", pagamentoId)
      .select()
      .single();

    if (error) throw error;

    // Atualizar evento relacionado
    const { data: evento } = await supabaseAdmin
      .from("eventos")
      .select("*")
      .eq("titulo", `📅 Vencimento: ${pagamento.descricao}`)
      .eq("status", "planejado")
      .single();

    if (evento) {
      await supabaseAdmin
        .from("eventos")
        .update({
          status: "realizado",
          descricao: `${evento.descricao} - Pago em ${new Date().toLocaleDateString()}`
        })
        .eq("id", evento.id);
    }

    return data;
  } catch (error) {
    console.error("[confirmarPagamentoViaComprovante] Erro:", error);
    throw error;
  }
}

// ========== FUNÇÃO PARA RIFAS - MEUS TICKETS ==========

export async function getMeusTickets(vendedorId: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("tickets_rifa")
      .select(`
        *,
        rifa:rifas(id, nome, premio)
      `)
      .eq("vendedor_id", vendedorId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("[getMeusTickets] Erro:", error);
    return [];
  }
}

// ========== FUNÇÃO PARA RANKING ==========

export async function getRankingBySala(salaId: number) {
  try {
    // Buscar todos os alunos da sala
    const { data: alunos, error: alunosError } = await supabaseAdmin
      .from("usuarios")
      .select("id, nome, email, avatar_url, valor_arrecadado_rifas, meta_individual")
      .eq("sala_id", salaId)
      .eq("role", "aluno");

    if (alunosError) throw alunosError;

    // Para cada aluno, calcular total de pagamentos e rifas
    const ranking = await Promise.all(
      (alunos || []).map(async (aluno) => {
        // Pagamentos pagos
        const { data: pagamentos } = await supabaseAdmin
          .from("pagamentos")
          .select("valor")
          .eq("usuario_id", aluno.id)
          .eq("status", "pago");

        const totalPagamentos = pagamentos?.reduce((sum, p) => sum + parseFloat(p.valor), 0) || 0;

        // Rifas vendidas (tickets pagos)
        const { data: tickets } = await supabaseAdmin
          .from("tickets_rifa")
          .select("valor")
          .eq("vendedor_id", aluno.id)
          .eq("status", "pago");

        const totalRifas = tickets?.reduce((sum, t) => sum + parseFloat(t.valor), 0) || 0;

        const totalArrecadado = totalPagamentos + totalRifas;
        const metaIndividual = parseFloat(aluno.meta_individual || "0");

        return {
          ...aluno,
          totalPagamentos,
          totalRifas,
          totalArrecadado,
          metaIndividual,
          percentualMeta: metaIndividual > 0 ? Math.round((totalArrecadado / metaIndividual) * 100) : 0
        };
      })
    );

    // Ordenar por total arrecadado (decrescente)
    return ranking.sort((a, b) => b.totalArrecadado - a.totalArrecadado);
  } catch (error) {
    console.error("[getRankingBySala] Erro:", error);
    return [];
  }
}

// ========== FUNÇÃO PARA VALIDAR CHAVE ==========

export async function validateChave(chave: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("chaves")
      .select("*")
      .eq("chave", chave)
      .single();

    if (error || !data) {
      return { valida: false, motivo: "Chave não encontrada" };
    }

    if (!data.ativa) {
      return { valida: false, motivo: "Chave inativa ou já utilizada" };
    }

    return { valida: true, registro: data, tipo: "premium" };
  } catch (error) {
    console.error("[validateChave] Erro:", error);
    return { valida: false, motivo: "Erro ao validar chave" };
  }
}
// ========== FUNÇÃO PARA BUSCAR PAGAMENTO POR ID ==========

export async function getPagamentoById(id: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from("pagamentos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("[getPagamentoById] Erro:", error);
    return null;
  }
}