import { Router } from "express";
import { requireAuth, requireAdmin } from "../auth.js";
import { 
  getPagamentosBySala, 
  getPagamentosByUsuario,
  getPagamentosPendentes,
  createPagamento, 
  updatePagamento,
  confirmarPagamentoViaComprovante,
  deletePagamento
} from "../storage.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Configurar multer para upload de comprovantes
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = "uploads/comprovantes/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `comprovante-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
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
    
    // Importar a função getPagamentoById
    const { getPagamentoById, deletePagamento } = await import("../storage.js");
    
    // Verificar se o pagamento existe
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

export default router;