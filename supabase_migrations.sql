-- Arquivo para criar as tabelas no Supabase SQL Editor

CREATE TYPE role_enum AS ENUM ('admin', 'aluno');
CREATE TYPE status_pagamento_enum AS ENUM ('pago', 'pendente', 'atrasado');
CREATE TYPE status_rifa_enum AS ENUM ('ativa', 'encerrada', 'sorteada');
CREATE TYPE status_evento_enum AS ENUM ('planejado', 'realizado', 'cancelado');
CREATE TYPE status_ticket_enum AS ENUM ('pago', 'pendente', 'cancelado');
CREATE TYPE tipo_mov_enum AS ENUM ('entrada', 'saida');
CREATE TYPE tipo_notificacao_enum AS ENUM ('pagamento', 'rifa', 'sistema');

-- 1. SALAS
CREATE TABLE salas (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  data_formatura TIMESTAMP,
  meta_valor NUMERIC(12, 2) DEFAULT 0,
  senha TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 2. USUARIOS
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  sala_id INTEGER REFERENCES salas(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  celular TEXT,
  role role_enum NOT NULL DEFAULT 'aluno',
  avatar_url TEXT,
  valor_arrecadado_rifas NUMERIC(12, 2) DEFAULT 0,
  meta_individual NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- 3. CHAVES
CREATE TABLE chaves (
  id SERIAL PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL DEFAULT 'premium',
  ativa BOOLEAN NOT NULL DEFAULT true,
  usada_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- 4. RIFAS
CREATE TABLE rifas (
  id SERIAL PRIMARY KEY,
  sala_id INTEGER NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10, 2) NOT NULL,
  premio TEXT NOT NULL,
  total_numeros INTEGER NOT NULL DEFAULT 200,
  data_sorteio TIMESTAMP,
  vencedor_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  numero_sorteado INTEGER,
  status status_rifa_enum NOT NULL DEFAULT 'ativa',
  sorteios_realizados INTEGER DEFAULT 0,
  ultimo_vencedor_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  ultimo_numero_sorteado INTEGER,
  ultimo_sorteio TIMESTAMP,
  valor_arrecadado NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 5. TICKETS RIFA
CREATE TABLE tickets_rifa (
  id SERIAL PRIMARY KEY,
  rifa_id INTEGER NOT NULL REFERENCES rifas(id) ON DELETE CASCADE,
  vendedor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  comprador_nome TEXT NOT NULL,
  comprador_contato TEXT,
  valor NUMERIC(10, 2) NOT NULL,
  numero INTEGER NOT NULL,
  status status_ticket_enum NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(rifa_id, numero)
);

-- 6. PAGAMENTOS
CREATE TABLE pagamentos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  sala_id INTEGER NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor NUMERIC(10, 2) NOT NULL,
  status status_pagamento_enum NOT NULL DEFAULT 'pendente',
  data_vencimento TIMESTAMP,
  data_pagamento TIMESTAMP,
  forma_pagamento TEXT DEFAULT 'pix',
  comprovante_url TEXT,
  descricao_pagamento TEXT,
  status_comprovante TEXT DEFAULT 'nenhum',
  motivo_rejeicao TEXT,
  analisado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  analisado_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 7. EVENTOS
CREATE TABLE eventos (
  id SERIAL PRIMARY KEY,
  sala_id INTEGER NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data TIMESTAMP,
  local TEXT,
  tipo TEXT NOT NULL DEFAULT 'evento',
  google_event_id TEXT,
  status status_evento_enum NOT NULL DEFAULT 'planejado',
  foto TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 8. METAS
CREATE TABLE metas (
  id SERIAL PRIMARY KEY,
  sala_id INTEGER NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  valor_meta NUMERIC(12, 2) NOT NULL,
  valor_atual NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 9. CONTRIBUICOES META
CREATE TABLE contribuicoes_meta (
  id SERIAL PRIMARY KEY,
  meta_id INTEGER NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
  aluno_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  valor NUMERIC(12, 2) NOT NULL,
  descricao TEXT,
  data TIMESTAMP NOT NULL DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 10. HISTORICO META
CREATE TABLE historico_meta (
  id SERIAL PRIMARY KEY,
  meta_id INTEGER NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  data TIMESTAMP NOT NULL DEFAULT now()
);

-- 11. CAIXA
CREATE TABLE caixa (
  id SERIAL PRIMARY KEY,
  sala_id INTEGER NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  tipo tipo_mov_enum NOT NULL,
  valor NUMERIC(12, 2) NOT NULL,
  data TIMESTAMP DEFAULT now(),
  categoria TEXT,
  created_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 12. NOTIFICACOES
CREATE TABLE notificacoes (
  id SERIAL PRIMARY KEY,
  aluno_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo tipo_notificacao_enum NOT NULL DEFAULT 'sistema',
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
