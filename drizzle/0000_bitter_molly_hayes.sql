CREATE TYPE "public"."role" AS ENUM('admin', 'aluno');--> statement-breakpoint
CREATE TYPE "public"."status_evento" AS ENUM('planejado', 'realizado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."status_pagamento" AS ENUM('pago', 'pendente', 'atrasado');--> statement-breakpoint
CREATE TYPE "public"."status_rifa" AS ENUM('ativa', 'encerrada', 'sorteada');--> statement-breakpoint
CREATE TYPE "public"."status_ticket" AS ENUM('pago', 'pendente', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."tipo_mov" AS ENUM('entrada', 'saida');--> statement-breakpoint
CREATE TABLE "caixa" (
	"id" serial PRIMARY KEY NOT NULL,
	"sala_id" integer NOT NULL,
	"descricao" text NOT NULL,
	"tipo" "tipo_mov" NOT NULL,
	"valor" numeric(12, 2) NOT NULL,
	"data" timestamp DEFAULT now(),
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chaves" (
	"id" serial PRIMARY KEY NOT NULL,
	"chave" text NOT NULL,
	"tipo" text DEFAULT 'premium' NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL,
	"usada_por" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "chaves_chave_unique" UNIQUE("chave")
);
--> statement-breakpoint
CREATE TABLE "eventos" (
	"id" serial PRIMARY KEY NOT NULL,
	"sala_id" integer NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text,
	"data" timestamp,
	"local" text,
	"status" "status_evento" DEFAULT 'planejado' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "metas" (
	"id" serial PRIMARY KEY NOT NULL,
	"sala_id" integer NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text,
	"valor_meta" numeric(12, 2) NOT NULL,
	"valor_atual" numeric(12, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pagamentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"sala_id" integer NOT NULL,
	"descricao" text NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"status" "status_pagamento" DEFAULT 'pendente' NOT NULL,
	"data_vencimento" timestamp,
	"data_pagamento" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rifas" (
	"id" serial PRIMARY KEY NOT NULL,
	"sala_id" integer NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"preco" numeric(10, 2) NOT NULL,
	"premio" text NOT NULL,
	"total_numeros" integer DEFAULT 200 NOT NULL,
	"data_sorteio" timestamp,
	"vencedor_id" integer,
	"numero_sorteado" integer,
	"status" "status_rifa" DEFAULT 'ativa' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "salas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"codigo" text NOT NULL,
	"data_formatura" timestamp,
	"meta_valor" numeric(12, 2) DEFAULT '0',
	"senha" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "salas_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "tickets_rifa" (
	"id" serial PRIMARY KEY NOT NULL,
	"rifa_id" integer NOT NULL,
	"vendedor_id" integer NOT NULL,
	"comprador_nome" text NOT NULL,
	"comprador_contato" text,
	"valor" numeric(10, 2) NOT NULL,
	"numero" integer NOT NULL,
	"status" "status_ticket" DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"sala_id" integer,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text NOT NULL,
	"celular" text,
	"role" "role" DEFAULT 'aluno' NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "caixa" ADD CONSTRAINT "caixa_sala_id_salas_id_fk" FOREIGN KEY ("sala_id") REFERENCES "public"."salas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caixa" ADD CONSTRAINT "caixa_created_by_usuarios_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chaves" ADD CONSTRAINT "chaves_usada_por_usuarios_id_fk" FOREIGN KEY ("usada_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_sala_id_salas_id_fk" FOREIGN KEY ("sala_id") REFERENCES "public"."salas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metas" ADD CONSTRAINT "metas_sala_id_salas_id_fk" FOREIGN KEY ("sala_id") REFERENCES "public"."salas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_sala_id_salas_id_fk" FOREIGN KEY ("sala_id") REFERENCES "public"."salas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rifas" ADD CONSTRAINT "rifas_sala_id_salas_id_fk" FOREIGN KEY ("sala_id") REFERENCES "public"."salas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rifas" ADD CONSTRAINT "rifas_vencedor_id_usuarios_id_fk" FOREIGN KEY ("vencedor_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets_rifa" ADD CONSTRAINT "tickets_rifa_rifa_id_rifas_id_fk" FOREIGN KEY ("rifa_id") REFERENCES "public"."rifas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets_rifa" ADD CONSTRAINT "tickets_rifa_vendedor_id_usuarios_id_fk" FOREIGN KEY ("vendedor_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_sala_id_salas_id_fk" FOREIGN KEY ("sala_id") REFERENCES "public"."salas"("id") ON DELETE no action ON UPDATE no action;