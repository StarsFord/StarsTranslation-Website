import { db } from '../server/database/db.js';

console.log('🔄 Adding user management features...\n');

try {
  // Add ban fields to users table
  console.log('Adding ban fields to users table...');
  (db as any).exec(`
    ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0;
  `);

  (db as any).exec(`
    ALTER TABLE users ADD COLUMN ban_reason TEXT;
  `);

  (db as any).exec(`
    ALTER TABLE users ADD COLUMN ban_expires_at DATETIME;
  `);

  (db as any).exec(`
    ALTER TABLE users ADD COLUMN banned_at DATETIME;
  `);

  (db as any).exec(`
    ALTER TABLE users ADD COLUMN banned_by INTEGER;
  `);

  console.log('✅ User ban fields added!\n');

  // Add status field to posts table
  console.log('Adding status field to posts table...');
  (db as any).exec(`
    ALTER TABLE posts ADD COLUMN status TEXT DEFAULT 'published';
  `);

  (db as any).exec(`
    ALTER TABLE posts ADD COLUMN reviewed_by INTEGER;
  `);

  (db as any).exec(`
    ALTER TABLE posts ADD COLUMN reviewed_at DATETIME;
  `);

  console.log('✅ Post status fields added!\n');

  // Update existing posts to published status
  db.prepare(`
    UPDATE posts SET status = 'published' WHERE status IS NULL
  `).run();

  console.log('✅ Existing posts set to published!\n');

  console.log('📊 Summary:');
  console.log('  - User ban system: Ready');
  console.log('  - Post approval system: Ready');
  console.log('  - Post statuses: pending, published, rejected');

  console.log('\n✅ User management features added successfully!');

} catch (error: any) {
  // Ignore column already exists errors
  if (!error.message?.includes('duplicate column name')) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } else {
    console.log('ℹ️  Columns already exist, skipping...');
  }
}
