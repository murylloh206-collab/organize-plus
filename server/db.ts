import { createClient } from '@supabase/supabase-js';
import { config } from "dotenv";

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ SUPABASE_URL ou SUPABASE_ANON_KEY não configuradas!");
  throw new Error("Variáveis do Supabase não configuradas");
}

console.log("[DB] Conectando ao Supabase Data API...");
console.log("[DB] URL:", supabaseUrl);

// Cliente anônimo (para operações públicas)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Cliente de serviço (para operações administrativas - usa service key)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : supabase;

// Testar conexão
(async () => {
  try {
    const { data, error } = await supabase.from('salas').select('count', { count: 'exact', head: true });
    if (error) {
      console.error("[DB] ❌ Erro ao conectar:", error.message);
      console.error("[DB] Verifique se as tabelas já foram criadas");
    } else {
      console.log("[DB] ✅ Conexão com Supabase estabelecida!");
    }
  } catch (err: any) {
    console.error("[DB] ❌ Falha ao conectar:", err.message);
  }
})();

export { supabase as db };