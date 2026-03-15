
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config();

const connectionString = process.env.DIRECT_URL;
const client = postgres(connectionString);
const db = drizzle(client);

async function addCelular() {
  try {
    console.log('🔧 Adicionando coluna "celular" à tabela usuarios...');
    
    await client`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS celular TEXT;
    `;
    
    console.log('✅ Coluna "celular" adicionada com sucesso!');
    
    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

addCelular();