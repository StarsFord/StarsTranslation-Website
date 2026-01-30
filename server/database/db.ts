import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import type { Database, DatabaseMethods } from '../types/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../data/stars-translations.db');
const dbDir = dirname(dbPath);

// Create data directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize SQL.js synchronously using top-level await
const SQL = await initSqlJs();

let sqlDb: SqlJsDatabase;

// Load existing database or create new one
if (fs.existsSync(dbPath)) {
  const buffer = fs.readFileSync(dbPath);
  sqlDb = new SQL.Database(buffer);
  console.log('Database loaded from file');
} else {
  sqlDb = new SQL.Database();
  console.log('New database created');
}

// Function to save database to file
const saveDatabase = (): void => {
  const data = sqlDb.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
};

interface PreparedStatement {
  run: (...params: any[]) => { changes: number; lastInsertRowid: number };
  get: (...params: any[]) => any;
  all: (...params: any[]) => any[];
  free: () => void;

}

// Wrapper object that matches better-sqlite3 API
const db: Database = {
  prepare: (sql: string): PreparedStatement => {
    return {
      run: (...params: any[]): { changes: number; lastInsertRowid: number } => {
        try {
          // For sql.js, we need to execute and get the ID in a specific way
          // Execute the main statement with parameters bound
          const stmt = sqlDb.prepare(sql);
          stmt.bind(params);
          stmt.step();
          stmt.free();

          // IMMEDIATELY get the last insert rowid and changes
          const lastIdStmt = sqlDb.prepare('SELECT last_insert_rowid() as id');
          lastIdStmt.step();
          const lastInsertRowid = lastIdStmt.getAsObject().id as number;
          lastIdStmt.free();

          const changesStmt = sqlDb.prepare('SELECT changes() as changes');
          changesStmt.step();
          const changes = changesStmt.getAsObject().changes as number;
          changesStmt.free();

          // Save database to file
          saveDatabase();

          return {
            changes: changes || 0,
            lastInsertRowid: lastInsertRowid || 0
          };
        } catch (err: any) {
          console.error('SQL Error:', err.message, 'Query:', sql);
          throw err;
        }
      },
      get: (...params: any[]): any => {
        try {
          const result = sqlDb.exec(sql, params);
          if (!result || !result.length || !result[0].values.length) return null;

          const columns = result[0].columns;
          const values = result[0].values[0];

          const row: Record<string, any> = {};
          columns.forEach((col, i) => {
            row[col] = values[i];
          });
          return row;
        } catch (err: any) {
          console.error('SQL Error:', err.message, 'Query:', sql);
          return null;
        }
      },
      all: (...params: any[]): any[] => {
        try {
          const result = sqlDb.exec(sql, params);
          if (!result || !result.length) return [];

          const columns = result[0].columns;
          const values = result[0].values;

          return values.map(row => {
            const obj: Record<string, any> = {};
            columns.forEach((col, i) => {
              obj[col] = row[i];
            });
            return obj;
          });
        } catch (err: any) {
          console.error('SQL Error:', err.message, 'Query:', sql);
          return [];
        }
      },
      free: (): void => {
        // No explicit free needed in sql.js for prepared statements
      }
    };
  },
  exec: (sql: string): void => {
    try {
      sqlDb.exec(sql);
      saveDatabase();
    } catch (err: any) {
      console.error('SQL Error:', err.message);
      throw err;
    }
  },
  close: (): void => {
    saveDatabase();
    sqlDb.close();
  }
};

(db as any).pragma = (pragma: string): void => {
  // sql.js doesn't support pragmas, just ignore
  console.log('Pragma ignored:', pragma);
};

// Initialize database with schema
const initDatabase = (): void => {
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Split by semicolon and execute each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  statements.forEach(statement => {
    try {
      sqlDb.run(statement + ';');
    } catch (err: any) {
      // Ignore "table already exists" errors
      if (!err.message.includes('already exists')) {
        console.error('Error executing statement:', err.message);
      }
    }
  });

  saveDatabase();
  console.log('Database initialized successfully');
};

export { db, initDatabase };
