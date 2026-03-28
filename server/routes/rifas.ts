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
  getAlunos
} from "../storage.js";
import { db } from "../db.js";
import { ticketsRifa, rifas, usuarios } from "../../shared/schema.js";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

// GET /api/rifas - Listar todas as rifas da sala
router.get("/", requireAuth, async (req, res) => {
  try {
    const querySalaId = req.query.salaId ? parseInt(req.query.salaId as string) : null;
    const salaId = querySalaId && !isNaN(querySalaId) ? querySalaId : req.session.salaId;
    
    if (!salaId || isNaN(salaId)) {
      return res.status(400).json({ message: "salaId é obrigatório e deve ser um número válido" });
    }
    
    const rifasList = await getRifasBySala(salaId);
    res.json(rifasList);
  } catch (error) {
    console.error("Erro ao buscar rifas:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/rifas/tickets - Listar todos os tickets da sala (para admin)
router.get("/tickets", requireAdmin, async (req: any, res: any) => {
  try {
    const salaId = req.session.salaId;
    
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
        rifaNome: rifas.nome,
        rifaPremio: rifas.premio
      })
      .from(ticketsRifa)
      .leftJoin(usuarios, eq(ticketsRifa.vendedorId, usuarios.id))
      .leftJoin(rifas, eq(ticketsRifa.rifaId, rifas.id))
      .where(eq(rifas.salaId, salaId))
      .orderBy(desc(ticketsRifa.createdAt));
    
    res.json(tickets);
  } catch (error) {
    console.error("Erro ao buscar tickets da sala:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

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

// GET /api/rifas/meus-tickets - Listar tickets do usuário logado
router.get("/meus-tickets", requireAuth, async (req, res) => {
  try {
    const vendedorId = req.session.userId!;
    const tickets = await getTicketsByVendedor(vendedorId);
    res.json(tickets);
  } catch (error) {
    console.error("Erro ao buscar tickets do vendedor:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// POST /api/rifas/:id/tickets - Criar novo ticket
router.post("/:id/tickets", requireAuth, async (req, res) => {
  try {
    const rifaId = parseInt(req.params.id);
    const { compradorNome, compradorContato, valor, numero, vendedorId } = req.body; // ← pega do body

    if (!compradorNome || !valor || !numero || !vendedorId) {
      return res.status(400).json({ message: "Nome do comprador, valor, número e vendedor são obrigatórios" });
    }

    // Verificar se o número já está ocupado
    const ticketsExistentes = await getTicketsByRifa(rifaId);
    const numeroOcupado = ticketsExistentes.some(t => t.numero === numero);
    
    if (numeroOcupado) {
      return res.status(400).json({ message: "Este número já está ocupado" });
    }

    const novoTicket = await createTicket({
      rifaId,
      vendedorId, // ← usa o vendedorId do body
      compradorNome,
      compradorContato: compradorContato || null,
      valor: valor.toString(),
      numero,
      status: "pendente"
    });
    
    res.status(201).json(novoTicket);
  } catch (error: any) {
    console.error("Erro ao criar ticket:", error);
    res.status(400).json({ message: error.message || "Erro ao criar ticket" });
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

export default router;