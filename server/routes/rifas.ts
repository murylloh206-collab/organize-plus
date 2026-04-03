import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth.js";
import {
  getRifasBySala, 
  getRifaById,
  createRifa, 
  updateRifa,
  deleteRifa,
  getTicketsByRifa, 
  getTicketsByVendedor, 
  createTicket, 
  updateTicket,
  updateTicketData,
  deleteTicket,
  marcarRifaComoSorteada,
  createNotificacao,
} from "../storage.js";
import { supabaseAdmin } from "../db.js";

const router = Router();

// ============================================
// ROTAS ESPECÍFICAS (SEM PARÂMETROS) - PRIMEIRO
// ============================================

// GET /api/rifas - Listar todas as rifas da sala
router.get("/", requireAuth, async (req, res) => {
  try {
    const querySalaId = req.query.salaId ? parseInt(req.query.salaId as string) : null;
    const salaId = querySalaId && !isNaN(querySalaId) ? querySalaId : req.session.salaId;
    
    if (!salaId || isNaN(salaId)) {
      console.log("[GET /rifas] salaId não encontrado, retornando array vazio");
      return res.status(200).json([]);
    }
    
    const rifasList = await getRifasBySala(salaId);
    return res.status(200).json(rifasList);
  } catch (error) {
    console.error("Erro ao buscar rifas:", error);
    return res.status(200).json([]);
  }
});

// GET /api/rifas/tickets - Listar todos os tickets da sala (para admin)
router.get("/tickets", requireAdmin, async (req: any, res: any) => {
  try {
    const salaId = req.session.salaId;
    
    const { data: ticketsInfo } = await supabaseAdmin.from("tickets_rifa").select("*, vendedor:usuarios!vendedor_id(nome), rifa:rifas!rifa_id(nome, premio)").eq("rifa.sala_id", salaId).order("created_at", { ascending: false });

    // Filtrar localmente senao temos que fazer queries separadas devido a limitacoes rls/inner join 
    const { data: rifasData } = await supabaseAdmin.from("rifas").select("id, nome, premio").eq("sala_id", salaId);
    const validRifaIds = (rifasData || []).map(r => r.id);
    
    let ticketsFinal: any[] = [];
    if(validRifaIds.length > 0) {
      const { data: ticketsData } = await supabaseAdmin.from("tickets_rifa").select("*, vendedor:usuarios!vendedor_id(nome)").in("rifa_id", validRifaIds).order("created_at", { ascending: false });
      ticketsFinal = (ticketsData || []).map((t: any) => {
        const r = rifasData?.find(r => r.id === t.rifa_id);
        return {
          id: t.id,
          rifaId: t.rifa_id,
          vendedorId: t.vendedor_id,
          vendedorNome: t.vendedor?.nome,
          compradorNome: t.comprador_nome,
          compradorContato: t.comprador_contato,
          valor: t.valor,
          numero: t.numero,
          status: t.status,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          rifaNome: r?.nome,
          rifaPremio: r?.premio
        }
      });
    }

    res.json(ticketsFinal);
  } catch (error) {
    console.error("Erro ao buscar tickets da sala:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/rifas/debug-session - Rota de debug
router.get("/debug-session", requireAuth, async (req, res) => {
  console.log("[DEBUG] Sessão completa:", req.session);
  res.json({
    hasSession: !!req.session,
    userId: req.session?.userId,
    userRole: req.session?.userRole,
    salaId: req.session?.salaId,
    sessionKeys: req.session ? Object.keys(req.session) : []
  });
});

// GET /api/rifas/meus-tickets - Listar tickets do usuário logado
router.get("/meus-tickets", requireAuth, async (req, res) => {
  try {
    const vendedorId = req.session.userId;
    
    console.log("[meus-tickets] ========== DEBUG ==========");
    console.log("[meus-tickets] userId da sessão:", vendedorId);
    console.log("[meus-tickets] Tipo do userId:", typeof vendedorId);
    
    if (!vendedorId) {
      console.log("[meus-tickets] ❌ userId não encontrado na sessão");
      return res.status(200).json([]);
    }
    
    const vendedorIdNum = typeof vendedorId === 'string' ? parseInt(vendedorId, 10) : vendedorId;
    
    if (isNaN(vendedorIdNum) || vendedorIdNum <= 0) {
      console.log("[meus-tickets] ❌ userId inválido após conversão:", vendedorIdNum);
      return res.status(200).json([]);
    }
    
    console.log("[meus-tickets] ✅ Buscando tickets para vendedorId:", vendedorIdNum);
    
    const { data: ticketsData } = await supabaseAdmin.from("tickets_rifa")
      .select("*, rifa:rifas!rifa_id(nome, premio)")
      .eq("vendedor_id", vendedorIdNum)
      .order("created_at", { ascending: false });
      
    const finalTickets = (ticketsData || []).map((t: any) => ({
        id: t.id,
        rifaId: t.rifa_id,
        vendedorId: t.vendedor_id,
        compradorNome: t.comprador_nome,
        compradorContato: t.comprador_contato,
        valor: t.valor,
        numero: t.numero,
        status: t.status,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        rifaNome: t.rifa?.nome,
        rifaPremio: t.rifa?.premio
    }));
    
    console.log(`[meus-tickets] ✅ Encontrados ${finalTickets.length} tickets`);
    
    return res.status(200).json(finalTickets);
    
  } catch (error) {
    console.error("[meus-tickets] ❌ Erro ao buscar tickets:", error);
    return res.status(200).json([]);
  }
});

// GET /api/rifas/test - Rota de teste
router.get("/test", async (req, res) => {
  res.json({ message: "Rota funcionando!" });
});

// ============================================
// ROTAS COM PARÂMETROS - DEPOIS
// ============================================

// GET /api/rifas/:id - Buscar rifa por ID
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "ID inválido" });
    }
    
    const salaId = req.session.salaId;
    
    if (!salaId) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    
    const rifa = await getRifaById(id);
    
    if (!rifa) {
      return res.status(404).json({ message: "Rifa não encontrada" });
    }
    
    if (rifa.salaId !== salaId) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    
    res.json(rifa);
  } catch (error) {
    console.error("Erro ao buscar rifa:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/rifas/:id/tickets - Listar tickets de uma rifa
router.get("/:id/tickets", requireAuth, async (req, res) => {
  try {
    const rifaId = parseInt(req.params.id);
    const tickets = await getTicketsByRifa(rifaId);
    res.json(tickets);
  } catch (error) {
    console.error("Erro ao buscar tickets:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// POST /api/rifas - Criar nova rifa
router.post("/", requireAdmin, async (req, res) => {
  try {
    const salaId = req.session.salaId;
    if (!salaId) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    const { nome, premio, preco, totalNumeros } = req.body;
    
    if (!nome || !premio || !preco) {
      return res.status(400).json({ message: "Nome, prêmio e preço são obrigatórios" });
    }

    const novaRifa = await createRifa({ 
      nome, 
      premio, 
      preco: preco.toString(),
      totalNumeros: totalNumeros || 200,
      salaId,
      status: "ativa"
    });
    
    res.status(201).json(novaRifa);
  } catch (error: any) {
    console.error("Erro ao criar rifa:", error);
    res.status(400).json({ message: error.message || "Erro ao criar rifa" });
  }
});

// POST /api/rifas/:id/tickets - Criar novo ticket
router.post("/:id/tickets", requireAuth, async (req, res) => {
  try {
    const rifaId = parseInt(req.params.id);
    const { compradorNome, compradorContato, valor, numero, vendedorId } = req.body;

    if (!compradorNome || !valor || !numero || !vendedorId) {
      return res.status(400).json({ message: "Nome do comprador, valor, número e vendedor são obrigatórios" });
    }

    const ticketsExistentes = await getTicketsByRifa(rifaId);
    const numeroOcupado = ticketsExistentes.some(t => t.numero === numero);
    
    if (numeroOcupado) {
      return res.status(400).json({ message: "Este número já está ocupado" });
    }

    const novoTicket = await createTicket({
      rifaId,
      vendedorId,
      compradorNome,
      compradorContato: compradorContato || null,
      valor: valor.toString(),
      numero,
      status: "pendente"
    });

    const rifaInfo = await getRifaById(rifaId);
    
    await createNotificacao({
      alunoId: vendedorId,
      titulo: "Nova rifa vendida!",
      mensagem: `Você vendeu a rifa #${String(numero).padStart(3, '0')} de "${rifaInfo?.nome ?? 'Rifa'}" para ${compradorNome}. Valor: R$ ${parseFloat(valor).toFixed(2)}.`,
      tipo: "rifa",
    });
    
    res.status(201).json(novoTicket);
  } catch (error: any) {
    console.error("Erro ao criar ticket:", error);
    res.status(400).json({ message: error.message || "Erro ao criar ticket" });
  }
});

// POST /api/rifas/:id/sortear - Sortear número da rifa
router.post("/:id/sortear", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const salaId = req.session.salaId;

    const rifa = await getRifaById(id);
    if (!rifa) {
      return res.status(404).json({ message: "Rifa não encontrada" });
    }

    if (rifa.salaId !== salaId) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    if (rifa.status !== "ativa") {
      return res.status(400).json({ message: "Esta rifa não está mais ativa" });
    }

    const tickets = await getTicketsByRifa(id);
    const ticketsPagos = tickets.filter(t => t.status === "pago");
    
    if (ticketsPagos.length === 0) {
      return res.status(400).json({ message: "Nenhum ticket pago para sortear" });
    }

    const indiceSorteado = Math.floor(Math.random() * ticketsPagos.length);
    const vencedor = ticketsPagos[indiceSorteado];
    
    if (!vencedor) {
      return res.status(400).json({ message: "Erro ao selecionar vencedor" });
    }

    if (!vencedor.vendedorId) {
      return res.status(400).json({ message: "Vencedor não possui vendedor associado" });
    }

    if (!vencedor.numero) {
      return res.status(400).json({ message: "Vencedor não possui número associado" });
    }

    const rifaAtualizada = await marcarRifaComoSorteada(
      id, 
      vencedor.vendedorId, 
      vencedor.numero
    );
    
    res.json({ 
      rifa: rifaAtualizada, 
      vencedor,
      numeroSorteado: vencedor.numero
    });
  } catch (error: any) {
    console.error("Erro ao sortear rifa:", error);
    res.status(400).json({ message: error.message || "Erro ao sortear rifa" });
  }
});

// PUT /api/rifas/:id - Atualizar rifa
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome, premio, preco, totalNumeros } = req.body;
    const salaId = req.session.salaId;

    const rifaExistente = await getRifaById(id);
    if (!rifaExistente) {
      return res.status(404).json({ message: "Rifa não encontrada" });
    }

    if (rifaExistente.salaId !== salaId) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    const rifaAtualizada = await updateRifa(id, { 
      nome, 
      premio, 
      preco: preco ? preco.toString() : undefined,
      totalNumeros: totalNumeros ? parseInt(totalNumeros) : undefined
    });
    
    res.json(rifaAtualizada);
  } catch (error: any) {
    console.error("Erro ao atualizar rifa:", error);
    res.status(400).json({ message: error.message || "Erro ao atualizar rifa" });
  }
});

// PUT /api/rifas/tickets/:id - Atualizar ticket completo (editar)
router.put("/tickets/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { compradorNome, compradorContato, vendedorId, valor, status } = req.body;

    if (!compradorNome || !vendedorId || !valor) {
      return res.status(400).json({ message: "Nome do comprador, vendedor e valor são obrigatórios" });
    }

    const ticketAtualizado = await updateTicketData(id, {
      compradorNome,
      compradorContato: compradorContato || null,
      vendedorId,
      valor: valor.toString(),
      status: status || "pendente"
    });
    
    res.json(ticketAtualizado);
  } catch (error: any) {
    console.error("Erro ao atualizar ticket:", error);
    res.status(400).json({ message: error.message || "Erro ao atualizar ticket" });
  }
});

// DELETE /api/rifas/:id - Deletar rifa
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const salaId = req.session.salaId;
    
    console.log(`[DELETE] Tentando deletar rifa ID: ${id}, salaId da sessão: ${salaId}`);

    const rifaExistente = await getRifaById(id);
    if (!rifaExistente) {
      console.log(`[DELETE] Rifa ${id} não encontrada`);
      return res.status(404).json({ message: "Rifa não encontrada" });
    }

    console.log(`[DELETE] Rifa encontrada, nome: ${rifaExistente.nome}, salaId da rifa: ${rifaExistente.salaId}`);

    if (rifaExistente.salaId !== salaId) {
      console.log(`[DELETE] Acesso negado: salaId da rifa (${rifaExistente.salaId}) != salaId da sessão (${salaId})`);
      return res.status(403).json({ message: "Acesso negado" });
    }

    await deleteRifa(id);
    console.log(`[DELETE] Rifa ${id} deletada com sucesso`);
    
    res.status(204).send();
  } catch (error: any) {
    console.error("Erro ao deletar rifa:", error);
    res.status(500).json({ message: error.message || "Erro interno ao deletar rifa" });
  }
});

// DELETE /api/rifas/tickets/:id - Deletar ticket
router.delete("/tickets/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await deleteTicket(id);
    res.status(204).send();
  } catch (error: any) {
    console.error("Erro ao deletar ticket:", error);
    res.status(400).json({ message: error.message || "Erro ao deletar ticket" });
  }
});

export default router;