/**
 * Script para importar dados de arquivos XLSX para PostgreSQL Cloud SQL
 * 
 * Pré-requisitos:
 * 1. Cloud SQL Proxy rodando
 * 2. Arquivos XLSX na pasta ./data/export/
 * 3. Variáveis de ambiente configuradas
 */

import XLSX from 'xlsx';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Configuração PostgreSQL
const pgPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'starstranslations',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1311',
});

// Caminho para os arquivos XLSX exportados
const exportDir = path.join(__dirname, '../data/export');

console.log('🔄 Starting XLSX to PostgreSQL import...\n');
console.log('📁 Export directory:', exportDir);
console.log('🐘 PostgreSQL:', `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'starstranslations'}\n`);

// Mapeamento de tabelas (ordem importa por causa de foreign keys)
const TABLES_ORDER = [
  'categories',
  'users',
  'posts',
  'post_versions',
  'attachments',
  'comments',
  'notifications',
  'post_followers',
  'tag_types',
  'tags',
  'post_tags'
];

async function importTable(tableName: string) {
  console.log(`🔄 Importing ${tableName}...`);
  
  const xlsxPath = path.join(exportDir, `${tableName}.xlsx`);
  
  if (!fs.existsSync(xlsxPath)) {
    console.log(`  ⚠️ File not found: ${xlsxPath}, skipping\n`);
    return;
  }

  try {
    // Ler arquivo XLSX
    const workbook = XLSX.readFile(xlsxPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      console.log(`  ⚠️ No data in ${tableName}.xlsx, skipping\n`);
      return;
    }

    console.log(`  📊 Found ${data.length} rows`);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const row of data) {
      try {
        // Obter colunas e valores (excluindo 'id' que é SERIAL)
        const columns = Object.keys(row).filter(col => col !== 'id');
        const values = columns.map(col => {
          const value = (row as any)[col];
          
          // Converter valores vazios em null
          if (value === '' || value === undefined) return null;
          
          // Converter booleanos (XLSX pode ter 0/1 ou true/false)
          if (typeof value === 'number' && ['is_translated', 'is_read'].includes(col)) {
            return value === 1;
          }
          
          return value;
        });

        // Criar query
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const insertSql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

        const result = await pgPool.query(insertSql, values);
        
        if (result.rowCount && result.rowCount > 0) {
          insertedCount++;
        } else {
          skippedCount++;
        }

      } catch (err: any) {
        // Ignorar duplicatas
        if (err.code === '23505') {
          skippedCount++;
        } else {
          console.error(`    ❌ Error inserting row:`, err.message);
          console.error(`    Row data:`, row);
        }
      }
    }

    console.log(`  ✅ Inserted ${insertedCount} rows, skipped ${skippedCount}\n`);

    // Resetar sequência do ID
    if (insertedCount > 0) {
      try {
        await pgPool.query(`
          SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), 
                       COALESCE((SELECT MAX(id) FROM ${tableName}), 1))
        `);
        console.log(`  🔢 Sequence reset for ${tableName}\n`);
      } catch (err: any) {
        console.log(`  ⚠️ Could not reset sequence (table might not have id column)\n`);
      }
    }

  } catch (err: any) {
    console.error(`  ❌ Error importing ${tableName}:`, err.message, '\n');
  }
}

async function importAll() {
  try {
    // Verificar se o diretório de export existe
    if (!fs.existsSync(exportDir)) {
      console.error(`❌ Export directory not found: ${exportDir}`);
      console.log('\n💡 Create the directory and place your XLSX files there:');
      console.log(`   mkdir -p ${exportDir}`);
      console.log(`   Then place files like: categories.xlsx, users.xlsx, posts.xlsx, etc.\n`);
      process.exit(1);
    }

    // Testar conexão
    console.log('🔌 Testing PostgreSQL connection...');
    await pgPool.query('SELECT NOW()');
    console.log('✅ Connection successful!\n');

    // Importar cada tabela na ordem correta
    for (const tableName of TABLES_ORDER) {
      await importTable(tableName);
    }

    console.log('🎉 Import completed successfully!');
    
    // Verificar dados importados
    console.log('\n📊 Import summary:');
    for (const tableName of TABLES_ORDER) {
      try {
        const result = await pgPool.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`  ${tableName}: ${result.rows[0].count} rows`);
      } catch (err) {
        console.log(`  ${tableName}: error reading`);
      }
    }

  } catch (error: any) {
    console.error('❌ Import failed:', error.message);
    throw error;
  } finally {
    await pgPool.end();
  }
}

// Executar import
importAll()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
