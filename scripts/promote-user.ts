import { db } from '../server/database/db.js';
import readline from 'readline';
import type { User } from '../server/types/database.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n=== StarsTranslations User Role Manager ===\n');

  // List all users
  const users = db.prepare('SELECT id, username, email, role FROM users ORDER BY id').all() as User[];

  if (users.length === 0) {
    console.log('No users found in the database.');
    rl.close();
    return;
  }

  console.log('Current users:');
  console.log('─'.repeat(60));
  users.forEach(user => {
    console.log(`ID: ${user.id} | Username: ${user.username.padEnd(20)} | Role: ${user.role}`);
  });
  console.log('─'.repeat(60));
  console.log('\nAvailable roles: admin, translator, user\n');

  const userId = await question('Enter user ID to update: ');
  const newRole = await question('Enter new role (admin/translator/user): ');

  if (!['admin', 'translator', 'user'].includes(newRole)) {
    console.log('\n❌ Invalid role. Must be: admin, translator, or user');
    rl.close();
    return;
  }

  const user = users.find(u => u.id === parseInt(userId));
  if (!user) {
    console.log('\n❌ User not found');
    rl.close();
    return;
  }

  try {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, userId);
    console.log(`\n✅ Successfully updated ${user.username}'s role to: ${newRole}`);
  } catch (error: any) {
    console.log('\n❌ Error updating user:', error.message);
  }

  rl.close();
}

main();
