import pkg from 'pg';
import dotenv from 'dotenv';

const { Client } = pkg;
dotenv.config();

async function seed() {
  // Usar DIRECT_URL para conexão direta
  const connectionString = process.env.DIRECT_URL;
  console.log('🌱 Conectando ao banco para inserir chaves...');
  
  const client = new Client({
    connectionString,
  });
  
  try {
    await client.connect();
    console.log('✅ Conectado!');
    
    const chaves = [
      { chave: 'A1B2-C3D4-E5F6-G7H8', tipo: 'premium', ativa: true },
      { chave: 'I9J0-K1L2-M3N4-O5P6', tipo: 'premium', ativa: true },
      { chave: 'Q7R8-S9T0-U1V2-W3X4', tipo: 'premium', ativa: true }
    ];
    
    console.log('\n🔑 Inserindo chaves...');
    
    for (const chave of chaves) {
      try {
        await client.query(
          'INSERT INTO chaves (chave, tipo, ativa) VALUES ($1, $2, $3) ON CONFLICT (chave) DO NOTHING',
          [chave.chave, chave.tipo, chave.ativa]
        );
        console.log(`   ✅ ${chave.chave} (${chave.tipo})`);
      } catch (err) {
        console.log(`   ❌ Erro ao inserir ${chave.chave}:`, err.message);
      }
    }
    
    // Verificar as chaves inseridas
    const res = await client.query('SELECT * FROM chaves');
    console.log('\n📋 Chaves no banco:');
    res.rows.forEach(row => {
      console.log(`   - ${row.chave} | Tipo: ${row.tipo} | Ativa: ${row.ativa} | Usada: ${row.usada}`);
    });
    
    console.log('\n🎉 Processo concluído!');
    
  } catch (err) {
    console.error('❌ Erro:', err);
  } finally {
    await client.end();
  }
}

seed();