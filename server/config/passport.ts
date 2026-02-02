// IMPORTANT: Load .env FIRST before checking any environment variables
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (two levels up from config/)
dotenv.config({ path: path.join(__dirname, '../../.env') });

import passport from 'passport';
import { Strategy as PatreonStrategy, Profile } from 'passport-patreon';
import { db } from '../database/db.js';
import type { User } from '../types/database.js';

passport.serializeUser<number>((user, done) => {
  done(null, (user as User).id);
});

passport.deserializeUser<number>((id, done) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | null;
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Configure Patreon Strategy
// This will be called when the module is imported, but AFTER .env is loaded
const configurePatreon = (): boolean => {
  if (!process.env.PATREON_CLIENT_ID || !process.env.PATREON_CLIENT_SECRET) {
    console.warn('⚠️  Patreon OAuth not configured. Set PATREON_CLIENT_ID and PATREON_CLIENT_SECRET in .env');
    return false;
  }

  try {
    passport.use(
      new PatreonStrategy(
        {
          clientID: process.env.PATREON_CLIENT_ID,
          clientSecret: process.env.PATREON_CLIENT_SECRET,
          callbackURL: process.env.PATREON_CALLBACK_URL || 'http://localhost:3000/auth/patreon/callback',
          scope: ['identity', 'identity[email]', 'campaigns', 'campaigns.members', 'identity.memberships']
        },
        async (accessToken: string, refreshToken: string, profile: Profile, done: (error: any, user?: any) => void) => {
          try {
            const patreonId = profile.id;

            // Patreon API v2 returns data in _json.attributes (not _json.data.attributes)
            const attributes = (profile as any)._json?.attributes || {};

            const username = attributes.full_name || attributes.first_name || profile.username || profile.displayName || 'Patreon User';
            const email = attributes.email || profile.emails?.[0]?.value || null;
            const avatarUrl = attributes.image_url || attributes.thumb_url || profile.photos?.[0]?.value || null;

            console.log('✅ Patreon user authenticated:', {
              patreonId,
              username,
              email,
              avatarUrl: avatarUrl ? 'Yes' : 'No'
            });

            // Ensure no undefined values (sql.js doesn't accept undefined)
            const safeAccessToken = accessToken || null;
            const safeRefreshToken = refreshToken || null;

            // Check if user exists
            let user = db.prepare('SELECT * FROM users WHERE patreon_id = ?').get(patreonId) as User | null;

            if (user) {
              // Update existing user
              const stmt = db.prepare(`
                UPDATE users
                SET username = ?, email = ?, avatar_url = ?, access_token = ?, refresh_token = ?, updated_at = CURRENT_TIMESTAMP
                WHERE patreon_id = ?
              `);
              stmt.run(username, email, avatarUrl, safeAccessToken, safeRefreshToken, patreonId);

              user = db.prepare('SELECT * FROM users WHERE patreon_id = ?').get(patreonId) as User;
            } else {
              // Create new user
              const stmt = db.prepare(`
                INSERT INTO users (patreon_id, username, email, avatar_url, access_token, refresh_token, role)
                VALUES (?, ?, ?, ?, ?, ?, 'user')
              `);
              const result = stmt.run(patreonId, username, email, avatarUrl, safeAccessToken, safeRefreshToken);

              user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
            }

            return done(null, user);
          } catch (error) {
            console.error('Patreon OAuth callback error:', error);
            return done(error, null);
          }
        }
      )
    );

    console.log('✅ Patreon OAuth configured successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Failed to configure Patreon OAuth:', error.message);
    return false;
  }
};

// Auto-configure on import
configurePatreon();

export default passport;
export { configurePatreon };
