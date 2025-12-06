import { db } from '../server/database/db.js';

console.log('🔄 Adding external_links column to posts table...\n');

try {
  // Check if column already exists
  const tableInfo = db.prepare('PRAGMA table_info(posts)').all() as any[];
  const columnExists = tableInfo.some((col: any) => col.name === 'external_links');

  if (columnExists) {
    console.log('✅ Column external_links already exists!');
  } else {
    // Add the column
    (db as any).exec('ALTER TABLE posts ADD COLUMN external_links TEXT');
    console.log('✅ Column external_links added successfully!');
  }

  console.log('\n📊 Updated posts table structure:');
  const updatedInfo = db.prepare('PRAGMA table_info(posts)').all();
  console.table(updatedInfo);

} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
