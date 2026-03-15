import { pgTable, serial, text, boolean, timestamp, decimal, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ---------- ENUMS ----------
export const roleEnum = pgEnum("role", ["admin", "aluno"]);
export const statusPagamentoEnum = pgEnum("status_pagamento", ["pago", "pendente", "atrasado"]);
export const tipoMovEnum = pgEnum("tipo_mov", ["entrada", "saida"]);
export const statusRifaEnum = pgEnum("status_rifa", ["ativa", "encerrada", "sorteada"]);
export const statusEventoEnum = pgEnum("status_evento", ["planejado", "realizado", "cancelado"]);
export const statusTicketEnum = pgEnum("status_ticket", ["pago", "pendente"]);

// ---------- SALAS ----------
export const salas = pgTable("salas", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  codigo: text("codigo").notNull().unique(),
  dataFormatura: timestamp("data_formatura"),
  metaValor: decimal("meta_valor", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- USUARIOS ----------
export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  salaId: integer("sala_id").references(() => salas.id),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash").notNull(),
  celular: text("celular"),
  role: roleEnum("role").default("aluno").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- CHAVES ----------
export const chaves = pgTable("chaves", {
  id: serial("id").primaryKey(),
  chave: text("chave").notNull().unique(),
  tipo: text("tipo").default("premium").notNull(),
  ativa: boolean("ativa").default(true).notNull(),
  usadaPor: integer("usada_por").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- RIFAS ----------
export const rifas = pgTable("rifas", {
  id: serial("id").primaryKey(),
  salaId: integer("sala_id").references(() => salas.id).notNull(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  preco: decimal("preco", { precision: 10, scale: 2 }).notNull(),
  premio: text("premio").notNull(),
  dataSorteio: timestamp("data_sorteio"),
  vencedorId: integer("vencedor_id").references(() => usuarios.id),
  status: statusRifaEnum("status").default("ativa").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- TICKETS RIFA ----------
export const ticketsRifa = pgTable("tickets_rifa", {
  id: serial("id").primaryKey(),
  rifaId: integer("rifa_id").references(() => rifas.id).notNull(),
  vendedorId: integer("vendedor_id").references(() => usuarios.id).notNull(),
  compradorNome: text("comprador_nome").notNull(),
  compradorContato: text("comprador_contato"),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  status: statusTicketEnum("status").default("pendente").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- PAGAMENTOS ----------
export const pagamentos = pgTable("pagamentos", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").references(() => usuarios.id).notNull(),
  salaId: integer("sala_id").references(() => salas.id).notNull(),
  descricao: text("descricao").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  status: statusPagamentoEnum("status").default("pendente").notNull(),
  dataVencimento: timestamp("data_vencimento"),
  dataPagamento: timestamp("data_pagamento"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- EVENTOS ----------
export const eventos = pgTable("eventos", {
  id: serial("id").primaryKey(),
  salaId: integer("sala_id").references(() => salas.id).notNull(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  data: timestamp("data"),
  local: text("local"),
  status: statusEventoEnum("status").default("planejado").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- METAS ----------
export const metas = pgTable("metas", {
  id: serial("id").primaryKey(),
  salaId: integer("sala_id").references(() => salas.id).notNull(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  valorMeta: decimal("valor_meta", { precision: 12, scale: 2 }).notNull(),
  valorAtual: decimal("valor_atual", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ---------- CAIXA ----------
export const caixa = pgTable("caixa", {
  id: serial("id").primaryKey(),
  salaId: integer("sala_id").references(() => salas.id).notNull(),
  descricao: text("descricao").notNull(),
  tipo: tipoMovEnum("tipo").notNull(),
  valor: decimal("valor", { precision: 12, scale: 2 }).notNull(),
  data: timestamp("data").defaultNow(),
  createdBy: integer("created_by").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- ZOD SCHEMAS ----------
export const insertSalaSchema = createInsertSchema(salas).omit({ id: true, createdAt: true });
export const insertUsuarioSchema = createInsertSchema(usuarios).omit({ id: true, createdAt: true });
export const insertRifaSchema = createInsertSchema(rifas).omit({ id: true, createdAt: true });
export const insertTicketSchema = createInsertSchema(ticketsRifa).omit({ id: true, createdAt: true });
export const insertPagamentoSchema = createInsertSchema(pagamentos).omit({ id: true, createdAt: true });
export const insertEventoSchema = createInsertSchema(eventos).omit({ id: true, createdAt: true });
export const insertMetaSchema = createInsertSchema(metas).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCaixaSchema = createInsertSchema(caixa).omit({ id: true, createdAt: true });
export const insertChaveSchema = createInsertSchema(chaves).omit({ id: true, createdAt: true });

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

// ---------- TYPES ----------
export type Sala = typeof salas.$inferSelect;
export type Usuario = typeof usuarios.$inferSelect;
export type Rifa = typeof rifas.$inferSelect;
export type TicketRifa = typeof ticketsRifa.$inferSelect;
export type Pagamento = typeof pagamentos.$inferSelect;
export type Evento = typeof eventos.$inferSelect;
export type Meta = typeof metas.$inferSelect;
export type CaixaMovimento = typeof caixa.$inferSelect;
export type Chave = typeof chaves.$inferSelect;
