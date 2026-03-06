import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import type { Database } from '../types/database.js';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// PostgreSQL connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || '/cloudsql/starstranslations-prod:us-central1:starstrasnlations-db',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'starstrasnlations',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Sss_!98906175',
  // For Cloud SQL Unix socket connection
  ...(process.env.NODE_ENV === 'production' && {
    host: '/cloudsql/starstranslations-prod:us-central1:starstrasnlations-db',
  })
});

console.log('🐘 PostgreSQL connection configured');
console.log('📍 Host:', process.env.NODE_ENV === 'production' 
  ? '/cloudsql/...' 
  : process.env.DB_HOST || 'localhost');
console.log('📊 Database:', process.env.DB_NAME || 'starstrasnlations');

interface PreparedStatement {
  run: (...params: any[]) => Promise<{ changes: number; lastInsertRowid: number }>;
  get: (...params: any[]) => Promise<any>;
  all: (...params: any[]) => Promise<any[]>;
  free: () => void;
}

// Wrapper object that mimics better-sqlite3 API but uses PostgreSQL
const db: Database = {
  prepare: (sql: string): PreparedStatement => {
    // Convert SQLite placeholders (?) to PostgreSQL ($1, $2, etc)
    let paramCount = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++paramCount}`);

    return {
      run: async (...params: any[]): Promise<{ changes: number; lastInsertRowid: number }> => {
        try {
          // For INSERT statements, add RETURNING id if not present
          let executeSql = pgSql;
          const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
          
          if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
            executeSql = pgSql.replace(/;?\s*$/i, ' RETURNING id');
          }

          const result = await pool.query(executeSql, params);
          
          let lastInsertRowid = 0;
          if (result.rows && result.rows.length > 0 && result.rows[0].id) {
            lastInsertRowid = result.rows[0].id;
          }

          return {
            changes: result.rowCount || 0,
            lastInsertRowid
          };
        } catch (err: any) {
          console.error('SQL Error:', err.message, 'Query:', pgSql);
          throw err;
        }
      },
      get: async (...params: any[]): Promise<any> => {
        try {
          const result = await pool.query(pgSql, params);
          return result.rows[0] || null;
        } catch (err: any) {
          console.error('SQL Error:', err.message, 'Query:', pgSql);
          return null;
        }
      },
      all: async (...params: any[]): Promise<any[]> => {
        try {
          const result = await pool.query(pgSql, params);
          return result.rows;
        } catch (err: any) {
          console.error('SQL Error:', err.message, 'Query:', pgSql);
          return [];
        }
      },
      free: (): void => {
        // No explicit free needed for PostgreSQL prepared statements
      }
    };
  },
  exec: async (sql: string): Promise<void> => {
    try {
      await pool.query(sql);
    } catch (err: any) {
      console.error('SQL Error:', err.message);
      throw err;
    }
  },
  close: async (): Promise<void> => {
    await pool.end();
  }
};

// Helper for handling transactions
export const beginTransaction = async () => {
  const client = await pool.connect();
  await client.query('BEGIN');
  return client;
};

export const commitTransaction = async (client: pg.PoolClient) => {
  await client.query('COMMIT');
  client.release();
};

export const rollbackTransaction = async (client: pg.PoolClient) => {
  await client.query('ROLLBACK');
  client.release();
};

// Initialize database with schema
const initDatabase = async (): Promise<void> => {
  try {
    const schemaPath = join(__dirname, 'schema-postgres.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.warn('⚠️ PostgreSQL schema file not found, skipping initialization');
      return;
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 Initializing PostgreSQL database...');
    
    // Execute the entire schema (PostgreSQL can handle multiple statements)
    await pool.query(schema);

    console.log('✅ PostgreSQL database initialized successfully');
  } catch (err: any) {
    // Don't fail if tables already exist
    if (err.message.includes('already exists')) {
      console.log('✅ Database already initialized');
    } else {
      console.error('❌ Database initialization error:', err.message);
      throw err;
    }
  }
};

export { db, initDatabase, pool };
