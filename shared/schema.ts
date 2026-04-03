import { z } from "zod";

// ---------- TYPES ----------
export interface Sala {
  id: number;
  nome: string;
  codigo: string;
  data_formatura: string | Date | null;
  meta_valor: string;
  senha: string | null;
  created_at: string | Date;
}

export interface Usuario {
  id: number;
  sala_id: number | null;
  nome: string;
  email: string;
  senha_hash: string;
  celular: string | null;
  role: "admin" | "aluno";
  avatar_url: string | null;
  valor_arrecadado_rifas: string;
  meta_individual: string;
  created_at: string | Date;
}

// Para manter compatibilidade com o frontend
export type InsertUsuario = Omit<Usuario, "id" | "created_at">;

export interface Chave {
  id: number;
  chave: string;
  tipo: string;
  ativa: boolean;
  usada_por: number | null;
  created_at: string | Date;
}

export interface Rifa {
  id: number;
  sala_id: number;
  nome: string;
  descricao: string | null;
  preco: string;
  premio: string;
  total_numeros: number;
  data_sorteio: string | Date | null;
  status: "ativa" | "encerrada" | "sorteada";
  sorteios_realizados: number;
  ultimo_vencedor_id: number | null;
  ultimo_numero_sorteado: number | null;
  ultimo_sorteio: string | Date | null;
  valor_arrecadado: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface TicketRifa {
  id: number;
  rifa_id: number;
  vendedor_id: number;
  comprador_nome: string;
  comprador_contato: string | null;
  valor: string;
  numero: number;
  status: "pago" | "pendente" | "cancelado";
  created_at: string | Date;
  updated_at: string | Date;
}

export interface Pagamento {
  id: number;
  usuario_id: number;
  sala_id: number;
  descricao: string;
  valor: string;
  status: "pago" | "pendente" | "atrasado";
  data_vencimento: string | Date | null;
  data_pagamento: string | Date | null;
  forma_pagamento: string;
  comprovante_url: string | null;
  descricao_pagamento: string | null;
  status_comprovante: string;
  motivo_rejeicao: string | null;
  analisado_por: number | null;
  analisado_em: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface Evento {
  id: number;
  sala_id: number;
  titulo: string;
  descricao: string | null;
  data: string | Date | null;
  local: string | null;
  tipo: string;
  google_event_id: string | null;
  status: "planejado" | "realizado" | "cancelado";
  foto: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface Meta {
  id: number;
  sala_id: number;
  titulo: string;
  descricao: string | null;
  valor_meta: string;
  valor_atual: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface ContribuicaoMeta {
  id: number;
  meta_id: number;
  aluno_id: number;
  valor: string;
  descricao: string | null;
  data: string | Date;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface HistoricoMeta {
  id: number;
  meta_id: number;
  tipo: string;
  descricao: string;
  usuario_id: number | null;
  data: string | Date;
}

export interface CaixaMovimento {
  id: number;
  sala_id: number;
  descricao: string;
  tipo: "entrada" | "saida";
  valor: string;
  data: string | Date;
  categoria: string | null;
  created_by: number | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface Notificacao {
  id: number;
  aluno_id: number;
  titulo: string;
  mensagem: string;
  tipo: "pagamento" | "rifa" | "sistema";
  lida: boolean;
  created_at: string | Date;
}

export type InsertNotificacao = Omit<Notificacao, "id" | "created_at">;

// ---------- ZOD SCHEMAS ----------
export const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(4),
});

export const registerSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  chave: z.string().min(1),
  salaId: z.number().optional(),
  nomeSala: z.string().optional(),
  dataFormatura: z.string().optional(),
  metaValor: z.number().optional(),
});

export const createRifaSchema = z.object({
  nome: z.string().min(3),
  premio: z.string().min(3),
  preco: z.number().positive(),
  totalNumeros: z.number().min(1).max(1000).default(200),
  descricao: z.string().optional(),
});

export const createTicketSchema = z.object({
  rifaId: z.number(),
  vendedorId: z.number(),
  numero: z.number().min(1).max(1000),
  compradorNome: z.string().min(3),
  compradorContato: z.string().optional(),
  valor: z.number().positive(),
  status: z.enum(["pago", "pendente", "cancelado"]).default("pendente"),
});

export const updateTicketSchema = z.object({
  compradorNome: z.string().min(3).optional(),
  compradorContato: z.string().optional(),
  vendedorId: z.number().optional(),
  valor: z.number().positive().optional(),
  status: z.enum(["pago", "pendente", "cancelado"]).optional(),
});