import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { requireAuth, requireAdmin } from "../auth.js";
import { 
  getPagamentosBySala, 
  getPagamentosByUsuario, 
  getPagamentosPendentes,
  getPagamentoById,
  createPagamento,
  updatePagamento,
  deletePagamento,
  confirmarPagamentoViaComprovante,
  aprovarComprovante,
  rejeitarComprovante,
  getPagamentosComComprovantePendente,
  createNotificacao,
} from "../storage.js";

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const router = Router();

// Configurar multer para upload de comprovantes
const storageMulter = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    const dir = "uploads/comprovantes/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `comprovante-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storageMulter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato de arquivo não permitido. Use JPG, PNG ou PDF."));
    }
  }
});

// GET /api/pagamentos - Listar todos os pagamentos da sala
router.get("/", requireAuth, async (req, res) => {
  try {
    const salaId = req.session.salaId!;
    const result = await getPagamentosBySala(salaId);
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar pagamentos:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/pagamentos/meus - Listar pagamentos do aluno logado
router.get("/meus", requireAuth, async (req, res) => {
  try {
    const usuarioId = req.session.userId!;
    const result = await getPagamentosByUsuario(usuarioId);
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar pagamentos do usuário:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/pagamentos/pendentes - Listar pagamentos pendentes (para admin)
router.get("/pendentes", requireAdmin, async (req, res) => {
  try {
    const salaId = req.session.salaId!;
    const result = await getPagamentosPendentes(salaId);
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar pagamentos pendentes:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// GET /api/pagamentos/comprovantes-pendentes - Listar comprovantes aguardando análise
router.get("/comprovantes-pendentes", requireAdmin, async (req, res) => {
  try {
    const salaId = req.session.salaId!;
    const result = await getPagamentosComComprovantePendente(salaId);
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar comprovantes pendentes:", error);
    res.status(500).json({ message: "Erro interno" });
  }
});

// POST /api/pagamentos - Criar novo pagamento
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { descricao, valor, usuarioId, dataVencimento, formaPagamento } = req.body;
    
    if (!descricao || !valor || !usuarioId || !dataVencimento) {
      return res.status(400).json({ message: "Descrição, valor, aluno e data de vencimento são obrigatórios" });
    }

    if (parseFloat(valor) <= 0) {
      return res.status(400).json({ message: "Valor deve ser maior que zero" });
    }

    const pagamento = await createPagamento({
      descricao,
      valor: valor.toString(),
      usuarioId: parseInt(usuarioId),
      salaId: req.session.salaId!,
      dataVencimento: new Date(dataVencimento),
      formaPagamento: formaPagamento || "pix",
      status: "pendente"
    });

    // Criar notificação para o aluno
    await createNotificacao({
      alunoId: parseInt(usuarioId),
      titulo: "Novo pagamento registrado",
      mensagem: `Um novo boleto de ${formatarMoeda(parseFloat(valor))} foi criado: ${descricao}. Vencimento: ${new Date(dataVencimento).toLocaleDateString("pt-BR")}.`,
      tipo: "pagamento",
    });

    res.status(201).json(pagamento);
  } catch (e: any) {
    console.error("Erro ao criar pagamento:", e);
    res.status(400).json({ message: e.message });
  }
});

// POST /api/pagamentos/confirmar-comprovante - Upload e confirmação de comprovante
router.post("/confirmar-comprovante", requireAuth, (req: any, res: any) => {
  upload.single("comprovante")(req, res, async (err: any) => {
    try {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const { pagamentoId, descricaoPagamento } = req.body;
      const comprovanteUrl = req.file?.path;

      if (!pagamentoId || !comprovanteUrl) {
        return res.status(400).json({ message: "Pagamento e comprovante são obrigatórios" });
      }

      const resultado = await confirmarPagamentoViaComprovante(
        parseInt(pagamentoId),
        comprovanteUrl,
        descricaoPagamento
      );

      res.json({ 
        success: true, 
        message: "Comprovante enviado com sucesso! Aguardando validação.",
        pagamento: resultado 
      });
    } catch (e: any) {
      console.error("Erro ao confirmar pagamento:", e);
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({ message: e.message });
    }
  });
});

// PATCH /api/pagamentos/:id - Atualizar status do pagamento
router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, dataPagamento, formaPagamento } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: "Status é obrigatório" });
    }

    const pagamento = await updatePagamento(id, { 
      status,
      dataPagamento: dataPagamento ? new Date(dataPagamento) : new Date(),
      formaPagamento
    });
    
    // Criar notificação sobre mudança de status
    if (pagamento) {
      const statusMsg = status === "pago" 
        ? `Seu pagamento de ${formatarMoeda(parseFloat(pagamento.valor))} (${pagamento.descricao}) foi confirmado!`
        : status === "atrasado"
        ? `Seu pagamento de ${formatarMoeda(parseFloat(pagamento.valor))} (${pagamento.descricao}) está atrasado.`
        : `Status do pagamento (${pagamento.descricao}) atualizado para: ${status}`;
      
      await createNotificacao({
        alunoId: pagamento.usuarioId,
        titulo: status === "pago" ? "Pagamento confirmado" : "Status de pagamento alterado",
        mensagem: statusMsg,
        tipo: "pagamento",
      });
    }
    
    res.json(pagamento);
  } catch (e: any) {
    console.error("Erro ao atualizar pagamento:", e);
    res.status(400).json({ message: e.message });
  }
});

// DELETE /api/pagamentos/:id - Deletar pagamento (apenas admin)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`[ROUTE] Tentando deletar pagamento ID: ${id}`);
    
    const pagamento = await getPagamentoById(id);
    
    if (!pagamento) {
      console.log(`[ROUTE] Pagamento ID ${id} não encontrado`);
      return res.status(404).json({ message: "Pagamento não encontrado" });
    }

    console.log(`[ROUTE] Pagamento encontrado, deletando...`);
    await deletePagamento(id);
    console.log(`[ROUTE] Pagamento ID ${id} deletado com sucesso`);
    res.status(204).send();
  } catch (e: any) {
    console.error(`[ROUTE] Erro ao deletar pagamento ID ${req.params.id}:`, e);
    res.status(400).json({ message: e.message });
  }
});

// Nova rota: Aluno envia comprovante
router.post("/:id/comprovante", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { comprovanteUrl, descricaoPagamento } = req.body;
    
    const pagamento = await getPagamentoById(parseInt(id));
    
    if (!pagamento) {
      return res.status(404).json({ message: "Pagamento não encontrado" });
    }
    
    if (pagamento.usuarioId !== req.session.userId) {
      return res.status(403).json({ message: "Não autorizado" });
    }
    
    const atualizado = await updatePagamento(parseInt(id), {
      comprovanteUrl,
      descricaoPagamento,
      statusComprovante: "pendente",
      status: "pendente"
    });
    
    res.json(atualizado);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// Nova rota: Admin aprova comprovante
router.post("/:id/aprovar", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const atualizado = await aprovarComprovante(
      parseInt(id),
      req.session.userId!
    );
    
    res.json(atualizado);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// Nova rota: Admin rejeita comprovante
router.post("/:id/rejeitar", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    if (!motivo) {
      return res.status(400).json({ message: "Motivo da rejeição é obrigatório" });
    }
    
    const atualizado = await rejeitarComprovante(
      parseInt(id),
      req.session.userId!,
      motivo
    );
    
    res.json(atualizado);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

export default router;