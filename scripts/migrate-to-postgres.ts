/**
 * Script para migrar dados do SQLite para PostgreSQL
 * 
 * Execute este script após:
 * 1. Configurar as variáveis de ambiente do PostgreSQL
 * 2. Inicializar o schema PostgreSQL (vai acontecer automaticamente)
 * 3. Baixar o arquivo stars-translations.db do bucket GCS
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Caminho para o banco SQLite
const sqlitePath = process.env.SQLITE_PATH || path.join(__dirname, '../data/stars-translations.db');

console.log('🔄 Starting migration from SQLite to PostgreSQL...\n');
console.log('📁 SQLite path:', sqlitePath);
console.log('🐘 PostgreSQL:', `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'starstranslations'}\n`);

async function migrate() {
  try {
    // 1. Carregar SQLite
    console.log('📂 Loading SQLite database...');
    const SQL = await initSqlJs();
    const buffer = fs.readFileSync(sqlitePath);
    const sqliteDb = new SQL.Database(buffer);
    console.log('✅ SQLite loaded\n');

    // 2. Inicializar PostgreSQL schema
    console.log('🔧 Initializing PostgreSQL schema...');
    const schemaPath = path.join(__dirname, '../server/database/schema-postgres.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pgPool.query(schema);
    console.log('✅ PostgreSQL schema initialized\n');

    // Tabelas na ordem correta (respeitando foreign keys)
    const tables = [
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

    // 3. Migrar cada tabela
    for (const table of tables) {
      console.log(`🔄 Migrating ${table}...`);
      
      try {
        // Buscar dados do SQLite
        const result = sqliteDb.exec(`SELECT * FROM ${table}`);
        
        if (!result || result.length === 0 || !result[0].values.length) {
          console.log(`  ⚠️ No data in ${table}, skipping\n`);
          continue;
        }

        const columns = result[0].columns;
        const rows = result[0].values;

        console.log(`  📊 Found ${rows.length} rows`);

        // Inserir no PostgreSQL
        let insertedCount = 0;
        for (const row of rows) {
          // Filtrar a coluna 'id' (será gerada automaticamente por SERIAL)
          const columnsWithoutId = columns.filter(col => col !== 'id');
          const valuesWithoutId = row.filter((_, idx) => columns[idx] !== 'id');

          const placeholders = columnsWithoutId.map((_, i) => `$${i + 1}`).join(', ');
          const insertSql = `INSERT INTO ${table} (${columnsWithoutId.join(', ')}) VALUES (${placeholders})`;

          try {
            await pgPool.query(insertSql, valuesWithoutId);
            insertedCount++;
          } catch (err: any) {
            // Ignorar duplicatas (violação de unique constraint)
            if (err.code === '23505') {
              console.log(`    ⚠️ Skipped duplicate row`);
            } else {
              console.error(`    ❌ Error inserting row:`, err.message);
            }
          }
        }

        console.log(`  ✅ Inserted ${insertedCount}/${rows.length} rows\n`);

        // Resetar a sequência do ID para o próximo valor correto
        if (insertedCount > 0) {
          await pgPool.query(`
            SELECT setval(pg_get_serial_sequence('${table}', 'id'), 
                         (SELECT MAX(id) FROM ${table}))
          `);
        }

      } catch (err: any) {
        console.error(`  ❌ Error migrating ${table}:`, err.message, '\n');
      }
    }

    console.log('🎉 Migration completed successfully!');
    
    // 4. Verificar dados migrados
    console.log('\n📊 Migration summary:');
    for (const table of tables) {
      try {
        const result = await pgPool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  ${table}: ${result.rows[0].count} rows`);
      } catch (err) {
        console.log(`  ${table}: error reading`);
      }
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pgPool.end();
  }
}

// Executar migração
migrate()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
