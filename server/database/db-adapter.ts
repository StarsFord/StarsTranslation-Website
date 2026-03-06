/**
 * Database adapter - escolhe entre SQLite (local) e PostgreSQL (produção)
 * baseado na variável de ambiente NODE_ENV ou DB_TYPE
 */

// Importar ambos os adaptadores
let db: any;
let initDatabase: any;

const usePostgres = process.env.DB_TYPE === 'postgres' || 
                    process.env.DB_HOST || 
                    process.env.NODE_ENV === 'production';

if (usePostgres) {
  console.log('🐘 Using PostgreSQL database');
  const pgModule = await import('./db-postgres.js');
  db = pgModule.db;
  initDatabase = pgModule.initDatabase;
} else {
    console.log('🗄️ Using SQLite database') ;
}

export { db, initDatabase };
