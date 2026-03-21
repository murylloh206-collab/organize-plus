ALTER TABLE "pagamentos" ADD COLUMN "forma_pagamento" text DEFAULT 'pix';--> statement-breakpoint
ALTER TABLE "pagamentos" ADD COLUMN "comprovante_url" text;--> statement-breakpoint
ALTER TABLE "pagamentos" ADD COLUMN "descricao_pagamento" text;