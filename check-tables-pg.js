import pkg from 'pg';
import dotenv from 'dotenv';

const { Client } = pkg;
dotenv.config();

async function checkTables() {
  // Usar DIRECT_URL (sem pgbouncer)
  const connectionString = process.env.DIRECT_URL;
  console.log('🔌 Conectando ao banco...');
  
  const client = new Client({
    connectionString,
  });
  
  try {
    await client.connect();
    console.log('✅ Conectado com sucesso!');
    
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tabelas encontradas:');
    if (res.rows.length === 0) {
      console.log('❌ Nenhuma tabela encontrada!');
    } else {
      res.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      console.log(`\n📊 Total: ${res.rows.length} tabelas`);
    }
    
  } catch (err) {
    console.error('❌ Erro ao conectar:', err);
  } finally {
    await client.end();
  }
}

checkTables();