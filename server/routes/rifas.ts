import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth.js";
import {
  getRifasBySala, createRifa, updateRifa,
  getTicketsByRifa, getTicketsByVendedor, createTicket, updateTicket,
} from "../storage.js";

const router = Router();

// GET /api/rifas?salaId=
router.get("/", requireAuth, async (req, res) => {
  const salaId = parseInt(req.query.salaId as string || String(req.session.salaId));
  if (!salaId) return res.status(400).json({ message: "salaId obrigatório" });
  const result = await getRifasBySala(salaId);
  res.json(result);
});

// POST /api/rifas
router.post("/", requireAdmin, async (req, res) => {
  try {
    const salaId = req.session.salaId!;
    const rifa = await createRifa({ ...req.body, salaId });
    res.json(rifa);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// PATCH /api/rifas/:id
router.patch("/:id", requireAdmin, async (req, res) => {
  const rifa = await updateRifa(parseInt(req.params.id), req.body);
  res.json(rifa);
});

// GET /api/rifas/:id/tickets
router.get("/:id/tickets", requireAuth, async (req, res) => {
  const tickets = await getTicketsByRifa(parseInt(req.params.id));
  res.json(tickets);
});

// GET /api/rifas/meus-tickets
router.get("/meus-tickets", requireAuth, async (req, res) => {
  const tickets = await getTicketsByVendedor(req.session.userId!);
  res.json(tickets);
});

// POST /api/rifas/:id/tickets
router.post("/:id/tickets", requireAuth, async (req, res) => {
  try {
    const ticket = await createTicket({
      ...req.body,
      rifaId: parseInt(req.params.id),
      vendedorId: req.session.userId!,
    });
    res.json(ticket);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// PATCH /api/rifas/tickets/:id
router.patch("/tickets/:id", requireAdmin, async (req, res) => {
  const ticket = await updateTicket(parseInt(req.params.id), req.body.status);
  res.json(ticket);
});

// POST /api/rifas/:id/sortear
router.post("/:id/sortear", requireAdmin, async (req, res) => {
  try {
    const tickets = await getTicketsByRifa(parseInt(req.params.id));
    const pagos = tickets.filter(t => t.status === "pago");
    if (pagos.length === 0) return res.status(400).json({ message: "Nenhum ticket pago para sortear" });
    const vencedor = pagos[Math.floor(Math.random() * pagos.length)];
    const rifa = await updateRifa(parseInt(req.params.id), {
      status: "sorteada",
      vencedorId: vencedor.vendedorId,
    });
    res.json({ rifa, vencedor });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

export default router;
