import { db } from '../server/database/db.js';

try {

  // Get the first user (usually the creator)
  const firstUser = db.prepare('SELECT id, username, role FROM users ORDER BY id LIMIT 1').get();

  if (!firstUser) {
    console.log('❌ No users found. Please login with Patreon first.');
    process.exit(1);
  }

  if (firstUser.role === 'admin') {
    console.log(`✅ User "${firstUser.username}" is already an admin.`);
    process.exit(0);
  }

  // Update to admin
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', firstUser.id);

  console.log(`✅ User "${firstUser.username}" has been promoted to admin!`);
  console.log('\nYou can now access the admin dashboard at: http://localhost:5173/admin');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
