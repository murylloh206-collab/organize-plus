-- Migration: Adicionar tabela de notificações
-- Data: 2026-03-29

-- Criar enum para tipo de notificação
DO $$ BEGIN
  CREATE TYPE "tipo_notificacao" AS ENUM ('pagamento', 'rifa', 'sistema');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS "notificacoes" (
  "id" serial PRIMARY KEY,
  "aluno_id" integer NOT NULL REFERENCES "usuarios"("id") ON DELETE CASCADE,
  "titulo" text NOT NULL,
  "mensagem" text NOT NULL,
  "tipo" "tipo_notificacao" DEFAULT 'sistema' NOT NULL,
  "lida" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS "idx_notificacoes_aluno" ON "notificacoes" ("aluno_id");
CREATE INDEX IF NOT EXISTS "idx_notificacoes_lida" ON "notificacoes" ("aluno_id", "lida");
CREATE INDEX IF NOT EXISTS "idx_notificacoes_created" ON "notificacoes" ("created_at" DESC);

-- Função para recalcular cotas automaticamente (compatível com storage.ts)
CREATE OR REPLACE FUNCTION recalcular_cotas_alunos()
RETURNS TRIGGER AS $$
DECLARE
  total_alunos INTEGER;
  meta_total DECIMAL;
  nova_cota DECIMAL;
  aluno_record RECORD;
BEGIN
  -- Buscar meta total da sala
  SELECT meta_valor INTO meta_total FROM salas WHERE id = NEW.sala_id;
  
  -- Contar total de alunos na sala
  SELECT COUNT(*) INTO total_alunos FROM usuarios WHERE sala_id = NEW.sala_id AND role = 'aluno';
  
  IF total_alunos = 0 THEN
    RETURN NEW;
  END IF;
  
  -- Calcular nova cota
  nova_cota = meta_total / total_alunos;
  
  -- Atualizar meta_individual de todos os alunos da sala
  UPDATE usuarios SET meta_individual = nova_cota 
  WHERE sala_id = NEW.sala_id AND role = 'aluno';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular cotas quando novo aluno entra
DROP TRIGGER IF EXISTS trigger_recalcular_cotas ON usuarios;
CREATE TRIGGER trigger_recalcular_cotas
AFTER INSERT ON usuarios
FOR EACH ROW
WHEN (NEW.role = 'aluno' AND NEW.sala_id IS NOT NULL)
EXECUTE FUNCTION recalcular_cotas_alunos();
