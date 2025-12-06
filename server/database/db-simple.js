import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

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

let sqlDb;

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
const saveDatabase = () => {
  const data = sqlDb.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
};

// Wrapper object that matches better-sqlite3 API
const db = {
  prepare: (sql) => {
    return {
      run: (...params) => {
        try {
          sqlDb.run(sql, params);
          saveDatabase();

          // Get changes and last insert rowid
          const changesResult = sqlDb.exec('SELECT changes() as changes');
          const lastIdResult = sqlDb.exec('SELECT last_insert_rowid() as id');

          return {
            changes: changesResult[0]?.values[0]?.[0] || 0,
            lastInsertRowid: lastIdResult[0]?.values[0]?.[0] || 0
          };
        } catch (err) {
          console.error('SQL Error:', err.message, 'Query:', sql);
          throw err;
        }
      },
      get: (...params) => {
        try {
          const result = sqlDb.exec(sql, params);
          if (!result || !result.length || !result[0].values.length) return null;

          const columns = result[0].columns;
          const values = result[0].values[0];

          const row = {};
          columns.forEach((col, i) => {
            row[col] = values[i];
          });
          return row;
        } catch (err) {
          console.error('SQL Error:', err.message, 'Query:', sql);
          return null;
        }
      },
      all: (...params) => {
        try {
          const result = sqlDb.exec(sql, params);
          if (!result || !result.length) return [];

          const columns = result[0].columns;
          const values = result[0].values;

          return values.map(row => {
            const obj = {};
            columns.forEach((col, i) => {
              obj[col] = row[i];
            });
            return obj;
          });
        } catch (err) {
          console.error('SQL Error:', err.message, 'Query:', sql);
          return [];
        }
      }
    };
  },
  exec: (sql) => {
    try {
      sqlDb.exec(sql);
      saveDatabase();
    } catch (err) {
      console.error('SQL Error:', err.message);
      throw err;
    }
  },
  pragma: (pragma) => {
    // sql.js doesn't support pragmas, just ignore
    console.log('Pragma ignored:', pragma);
  }
};

// Initialize database with schema
const initDatabase = () => {
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
    } catch (err) {
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
