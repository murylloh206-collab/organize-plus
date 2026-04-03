import { Router } from "express";
import { requireAuth } from "../auth.js";
import { getAuthUrl, getTokensFromCode, createCalendarEvent, listCalendarEvents } from "../services/googleCalendar.js";
import { supabaseAdmin } from "../db.js";

const router = Router();

// Rota para iniciar autenticação com Google
router.get("/auth", requireAuth, (req, res) => {
  try {
    const userId = req.session.userId!;
    const authUrl = getAuthUrl(userId);
    res.json({ url: authUrl });
  } catch (error) {
    console.error("Erro ao gerar URL de autenticação:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// Rota de callback do Google OAuth
router.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = parseInt(state as string);

    if (!code || !userId) {
      return res.status(400).json({ message: "Código ou usuário inválido" });
    }

    await getTokensFromCode(code as string, userId);
    
    // Redirecionar para o frontend
    res.redirect(`${process.env.FRONTEND_URL}/admin/eventos?sync=success`);
  } catch (error) {
    console.error("Erro no callback do Google:", error);
    res.redirect(`${process.env.FRONTEND_URL}/admin/eventos?sync=error`);
  }
});

// Rota para sincronizar evento específico
router.post("/sync-event/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const eventoId = parseInt(req.params.id);

    // Buscar evento no banco
    const { data: evento } = await supabaseAdmin.from("eventos").select("*").eq("id", eventoId).single();
    
    if (!evento) {
      return res.status(404).json({ message: "Evento não encontrado" });
    }

    // Verificar se a data existe
    if (!evento.data) {
      return res.status(400).json({ message: "Evento não possui data definida" });
    }

    // Criar no Google Calendar
    const googleEvent = await createCalendarEvent(userId, {
      titulo: evento.titulo,
      descricao: evento.descricao || undefined,
      data: new Date(evento.data), // agora é seguro porque verificamos que não é null
      local: evento.local || undefined
    });

    // Salvar ID do Google Calendar no evento
    await supabaseAdmin.from("eventos")
      .update({ google_event_id: googleEvent.id })
      .eq("id", eventoId);

    res.json({ success: true, googleEvent });
  } catch (error) {
    console.error("Erro ao sincronizar evento:", error);
    res.status(500).json({ message: "Erro ao sincronizar com Google Calendar" });
  }
});

// Rota para listar eventos do Google Calendar
router.get("/list", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const events = await listCalendarEvents(userId);
    res.json(events);
  } catch (error) {
    console.error("Erro ao listar eventos do Google:", error);
    res.status(500).json({ message: "Erro ao buscar eventos do Google Calendar" });
  }
});

export default router;