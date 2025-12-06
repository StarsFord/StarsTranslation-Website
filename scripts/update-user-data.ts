import { db } from '../server/database/db.js';

console.log('🔄 Updating user data...\n');

// Update user ID 2 with correct Patreon data
const username = 'DarlanZero';
const avatarUrl = 'https://c10.patreonusercontent.com/4/patreon-media/p/user/79165140/d78cee9c364748fba93075fa414bc91c/eyJ3IjoyMDB9/2.jpg?token-hash=gjJ0KxXgLchIK4r2-OhqsfvWGTBMTnFQNJn533Q51Mk%3D';

try {
  db.prepare(`
    UPDATE users
    SET username = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 2
  `).run(username, avatarUrl);

  const user = db.prepare('SELECT id, username, email, avatar_url, role FROM users WHERE id = 2').get();

  console.log('✅ User updated successfully!\n');
  console.log('Updated user:');
  console.log(JSON.stringify(user, null, 2));
} catch (error: any) {
  console.error('❌ Error updating user:', error.message);
}
