CREATE TABLE "contribuicoes_meta" (
	"id" serial PRIMARY KEY NOT NULL,
	"meta_id" integer NOT NULL,
	"aluno_id" integer NOT NULL,
	"valor" numeric(12, 2) NOT NULL,
	"descricao" text,
	"data" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "historico_meta" (
	"id" serial PRIMARY KEY NOT NULL,
	"meta_id" integer NOT NULL,
	"tipo" text NOT NULL,
	"descricao" text NOT NULL,
	"usuario_id" integer,
	"data" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"sid" text PRIMARY KEY NOT NULL,
	"sess" text NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "eventos" ADD COLUMN "tipo" text DEFAULT 'evento' NOT NULL;--> statement-breakpoint
ALTER TABLE "contribuicoes_meta" ADD CONSTRAINT "contribuicoes_meta_meta_id_metas_id_fk" FOREIGN KEY ("meta_id") REFERENCES "public"."metas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contribuicoes_meta" ADD CONSTRAINT "contribuicoes_meta_aluno_id_usuarios_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_meta" ADD CONSTRAINT "historico_meta_meta_id_metas_id_fk" FOREIGN KEY ("meta_id") REFERENCES "public"."metas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_meta" ADD CONSTRAINT "historico_meta_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;