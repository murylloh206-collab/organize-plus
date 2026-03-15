import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client);

async function checkTables() {
  try {
    console.log('🔍 Verificando tabelas no banco...');
    
    const result = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('📋 Tabelas encontradas:');
    if (result.length === 0) {
      console.log('❌ Nenhuma tabela encontrada!');
    } else {
      result.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar:', error);
  } finally {
    await client.end();
  }
}

checkTables();