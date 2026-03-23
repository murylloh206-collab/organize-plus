import { db } from "./db.js";
import { usuarios, salas, chaves, rifas, ticketsRifa, pagamentos, eventos, metas, caixa } from "../shared/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { hashSenha } from "./auth.js";
import { contribuicoesMeta, historicoMeta } from "../shared/schema.js";
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
        celular: data.celular ?? null,
        role: data.role ?? "aluno", salaId: data.salaId ?? null,
        valorArrecadadoRifas: "0"
    }).returning();
    return user;
}
export async function getAlunosBySala(salaId) {
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
export async function updateUser(id, data) {
    const updateData = {};
    if (data.nome !== undefined)
        updateData.nome = data.nome;
    if (data.email !== undefined)
        updateData.email = data.email;
    if (data.celular !== undefined)
        updateData.celular = data.celular;
    if (data.salaId !== undefined)
        updateData.salaId = data.salaId;
    if (data.avatarUrl !== undefined)
        updateData.avatarUrl = data.avatarUrl;
    if (data.valorArrecadadoRifas !== undefined)
        updateData.valorArrecadadoRifas = data.valorArrecadadoRifas;
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
export async function deleteUser(id) {
    await db
        .delete(usuarios)
        .where(eq(usuarios.id, id));
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
        senha: data.senha ?? null,
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
export async function getRifaById(id) {
    const [rifa] = await db.select().from(rifas).where(eq(rifas.id, id)).limit(1);
    return rifa;
}
export async function createRifa(data) {
    const dadosCompletos = {
        ...data,
        totalNumeros: data.totalNumeros || 200,
        sorteiosRealizados: 0,
        valorArrecadado: "0"
    };
    const [rifa] = await db.insert(rifas).values(dadosCompletos).returning();
    return rifa;
}
export async function updateRifa(id, data) {
    const { updatedAt, createdAt, ...dataLimpa } = data;
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
export async function deleteRifa(id) {
    await db.delete(ticketsRifa).where(eq(ticketsRifa.rifaId, id));
    await db.delete(rifas).where(eq(rifas.id, id));
}
export async function atualizarValorArrecadadoAluno(alunoId) {
    const [result] = await db
        .select({
        total: sql `COALESCE(SUM(valor::numeric), 0)`.as("total"),
    })
        .from(ticketsRifa)
        .where(and(eq(ticketsRifa.vendedorId, alunoId), eq(ticketsRifa.status, "pago")));
    const totalArrecadado = parseFloat(result?.total || "0");
    await db
        .update(usuarios)
        .set({
        valorArrecadadoRifas: totalArrecadado.toString()
    })
        .where(eq(usuarios.id, alunoId));
}
export async function marcarRifaComoSorteada(id, vencedorId, numeroSorteado) {
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
export async function getTicketsByRifa(rifaId) {
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
export async function getTicketsByVendedor(vendedorId) {
    return db.select().from(ticketsRifa).where(eq(ticketsRifa.vendedorId, vendedorId)).orderBy(desc(ticketsRifa.createdAt));
}
export async function createTicket(data) {
    const ticketsExistentes = await db
        .select()
        .from(ticketsRifa)
        .where(and(eq(ticketsRifa.rifaId, data.rifaId), eq(ticketsRifa.numero, data.numero)));
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
export async function updateTicket(id, status) {
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
async function atualizarArrecadacaoRifa(rifaId) {
    const [result] = await db
        .select({
        total: sql `COALESCE(SUM(valor::numeric), 0)`.as("total"),
    })
        .from(ticketsRifa)
        .where(and(eq(ticketsRifa.rifaId, rifaId), eq(ticketsRifa.status, "pago")));
    const totalArrecadado = parseFloat(result?.total || "0");
    await db
        .update(rifas)
        .set({
        valorArrecadado: totalArrecadado.toString(),
        updatedAt: new Date()
    })
        .where(eq(rifas.id, rifaId));
}
export async function updateTicketData(id, data) {
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
export async function deleteTicket(id) {
    const [ticket] = await db
        .select()
        .from(ticketsRifa)
        .where(eq(ticketsRifa.id, id))
        .limit(1);
    if (!ticket) {
        throw new Error("Ticket não encontrado");
    }
    await db
        .delete(ticketsRifa)
        .where(eq(ticketsRifa.id, id));
    await atualizarValorArrecadadoAluno(ticket.vendedorId);
    await atualizarArrecadacaoRifa(ticket.rifaId);
}
export async function getAlunos(salaId) {
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
        .where(and(eq(usuarios.salaId, salaId), eq(usuarios.role, "aluno")))
        .orderBy(usuarios.nome);
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
    return db.select().from(pagamentos)
        .where(eq(pagamentos.usuarioId, usuarioId))
        .orderBy(desc(pagamentos.dataVencimento));
}
export async function getPagamentosPendentes(salaId) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return db.select({
        pagamento: pagamentos,
        usuario: { nome: usuarios.nome, email: usuarios.email, avatarUrl: usuarios.avatarUrl },
    })
        .from(pagamentos)
        .leftJoin(usuarios, eq(pagamentos.usuarioId, usuarios.id))
        .where(and(eq(pagamentos.salaId, salaId), eq(pagamentos.status, "pendente")))
        .orderBy(pagamentos.dataVencimento);
}
export async function getPagamentoById(id) {
    const [pagamento] = await db.select().from(pagamentos)
        .where(eq(pagamentos.id, id))
        .limit(1);
    return pagamento;
}
export async function createPagamento(data) {
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
export async function updatePagamento(id, data) {
    const updateData = {};
    if (data.status !== undefined)
        updateData.status = data.status;
    if (data.dataPagamento !== undefined)
        updateData.dataPagamento = data.dataPagamento;
    if (data.formaPagamento !== undefined)
        updateData.formaPagamento = data.formaPagamento;
    if (data.comprovanteUrl !== undefined)
        updateData.comprovanteUrl = data.comprovanteUrl;
    if (data.descricaoPagamento !== undefined)
        updateData.descricaoPagamento = data.descricaoPagamento;
    updateData.updatedAt = new Date();
    const [pagamento] = await db.update(pagamentos)
        .set(updateData)
        .where(eq(pagamentos.id, id))
        .returning();
    return pagamento;
}
export async function confirmarPagamentoViaComprovante(pagamentoId, comprovanteUrl, descricaoPagamento) {
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
            .where(and(eq(eventos.titulo, `📅 Vencimento: ${pagamento.descricao}`), eq(eventos.status, "planejado")))
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
export async function deletePagamento(id) {
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
            .where(and(eq(eventos.titulo, `📅 Vencimento: ${pagamento.descricao}`), eq(eventos.tipo, "vencimento")))
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
export async function getEventosBySala(salaId) {
    return db.select().from(eventos)
        .where(eq(eventos.salaId, salaId))
        .orderBy(desc(eventos.data));
}
export async function createEvento(data) {
    const [ev] = await db.insert(eventos).values({
        titulo: data.titulo,
        descricao: data.descricao || null,
        data: data.data,
        local: data.local || null,
        tipo: data.tipo || "evento",
        status: (data.status || "planejado"),
        salaId: data.salaId,
        createdAt: new Date(),
        updatedAt: new Date()
    }).returning();
    return ev;
}
export async function updateEvento(id, data) {
    const updateData = {};
    if (data.titulo !== undefined)
        updateData.titulo = data.titulo;
    if (data.descricao !== undefined)
        updateData.descricao = data.descricao;
    if (data.data !== undefined)
        updateData.data = data.data;
    if (data.local !== undefined)
        updateData.local = data.local;
    if (data.tipo !== undefined)
        updateData.tipo = data.tipo;
    if (data.status !== undefined)
        updateData.status = data.status;
    updateData.updatedAt = new Date();
    const [ev] = await db
        .update(eventos)
        .set(updateData)
        .where(eq(eventos.id, id))
        .returning();
    return ev;
}
export async function deleteEvento(id) {
    await db.delete(eventos).where(eq(eventos.id, id));
}
export async function getEventosProximos(salaId, limit = 10) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return db.select()
        .from(eventos)
        .where(and(eq(eventos.salaId, salaId), sql `${eventos.data} >= ${hoje.toISOString()}`))
        .orderBy(eventos.data)
        .limit(limit);
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
export async function getMetaById(id) {
    const [meta] = await db.select().from(metas).where(eq(metas.id, id)).limit(1);
    return meta;
}
// ---------- CONTRIBUIÇÕES DE METAS ----------
export async function getContribuicoesByMeta(metaId) {
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
export async function deleteMeta(id) {
    return await db.transaction(async (tx) => {
        await tx.delete(contribuicoesMeta)
            .where(eq(contribuicoesMeta.metaId, id));
        await tx.delete(historicoMeta)
            .where(eq(historicoMeta.metaId, id));
        await tx.delete(metas)
            .where(eq(metas.id, id));
    });
}
export async function createContribuicao(data) {
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
export async function updateContribuicao(id, data) {
    return await db.transaction(async (tx) => {
        const [contribOriginal] = await tx.select()
            .from(contribuicoesMeta)
            .where(eq(contribuicoesMeta.id, id))
            .limit(1);
        if (!contribOriginal) {
            throw new Error("Contribuição não encontrada");
        }
        const updateData = {};
        if (data.alunoId !== undefined)
            updateData.alunoId = data.alunoId;
        if (data.valor !== undefined)
            updateData.valor = data.valor;
        if (data.descricao !== undefined)
            updateData.descricao = data.descricao;
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
export async function deleteContribuicao(id) {
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
export async function getHistoricoByMeta(metaId) {
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
    const [rifasResult] = await db
        .select({
        total: sql `COALESCE(SUM(t.valor::numeric), 0)`.as("total"),
    })
        .from(ticketsRifa)
        .innerJoin(rifas, eq(ticketsRifa.rifaId, rifas.id))
        .where(and(eq(rifas.salaId, salaId), eq(ticketsRifa.status, "pago")));
    const [ticketsResult] = await db
        .select({ count: sql `COUNT(*)`.as("count") })
        .from(ticketsRifa)
        .innerJoin(rifas, eq(ticketsRifa.rifaId, rifas.id))
        .where(eq(rifas.salaId, salaId));
    const saldo = await getSaldoCaixa(salaId);
    const totalPagamentos = parseFloat(pagsResult?.total ?? "0");
    const totalRifas = parseFloat(rifasResult?.total ?? "0");
    return {
        totalArrecadado: totalPagamentos + totalRifas,
        totalAlunos: parseInt(alunosResult?.count ?? "0"),
        totalTickets: parseInt(ticketsResult?.count ?? "0"),
        saldoCaixa: saldo,
    };
}
