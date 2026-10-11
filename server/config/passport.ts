// IMPORTANT: Load .env FIRST before checking any environment variables
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import type { Profile } from 'passport';
import axios from 'axios';
import { db } from '../database/db.js';
import type { User } from '../types/database.js';

interface PatreonResource {
  id: string;
  type: string;
  attributes?: Record<string, any>;
  relationships?: Record<string, { data?: PatreonResource[] | PatreonResource | null }>;
}

interface PatreonIdentityResponse {
  data: PatreonResource;
  included?: PatreonResource[];
}

interface PatreonProfile extends Profile {
  _raw: string;
  _json: PatreonIdentityResponse;
  patreonTier: string;
}

const getPatreonTier = (identity: PatreonIdentityResponse): string => {
  const included = identity.included || [];
  const membership = included.find(
    item => item.type === 'member' && item.attributes?.patron_status === 'active_patron'
  );
  const entitledTiers = membership?.relationships?.currently_entitled_tiers?.data;

  if (!Array.isArray(entitledTiers) || entitledTiers.length === 0) {
    return 'free';
  }

  const entitledTierIds = new Set(entitledTiers.map(tier => tier.id));
  const tier = included.find(item => item.type === 'tier' && entitledTierIds.has(item.id));
  return String(tier?.attributes?.title || 'paid');
};

passport.serializeUser<number>((user, done) => {
  done(null, (user as User).id);
});

passport.deserializeUser<number>(async (id, done) => {
  try {
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | null;
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

const configurePatreon = (): boolean => {
  if (!process.env.PATREON_CLIENT_ID || !process.env.PATREON_CLIENT_SECRET) {
    console.warn('⚠️  Patreon OAuth not configured. Set PATREON_CLIENT_ID and PATREON_CLIENT_SECRET in .env');
    return false;
  }

  try {
    const strategy = new OAuth2Strategy(
      {
        authorizationURL: 'https://www.patreon.com/oauth2/authorize',
        tokenURL: 'https://www.patreon.com/api/oauth2/token',
        clientID: process.env.PATREON_CLIENT_ID,
        clientSecret: process.env.PATREON_CLIENT_SECRET,
        callbackURL: process.env.PATREON_CALLBACK_URL || 'http://localhost:3000/auth/patreon/callback',
        scope: ['identity', 'identity[email]', 'identity.memberships']
      },
      async (accessToken: string, refreshToken: string, profile: Profile, done: (error: any, user?: any) => void) => {
          try {
            const patreonProfile = profile as PatreonProfile;
            const patreonId = patreonProfile.id;
            const attributes = patreonProfile._json.data.attributes || {};
            const username = attributes.full_name || attributes.first_name || profile.username || profile.displayName || 'Patreon User';
            const email = attributes.email || profile.emails?.[0]?.value || null;
            const avatarUrl = attributes.image_url || attributes.thumb_url || profile.photos?.[0]?.value || null;
            const patreonTier = patreonProfile.patreonTier;

            console.log('✅ Patreon user authenticated:', {
              patreonId,
              username,
              email,
              avatarUrl: avatarUrl ? 'Yes' : 'No',
              patreonTier
            });

            const safeAccessToken = accessToken || null;
            const safeRefreshToken = refreshToken || null;

            // Check if user exists
            let user = await db.prepare('SELECT * FROM users WHERE patreon_id = ?').get(patreonId) as User | null;

            if (user) {
              // Update existing user
              await db.prepare(`
                UPDATE users
                SET username = ?, email = ?, avatar_url = ?, access_token = ?, refresh_token = ?, patreon_tier = ?, updated_at = CURRENT_TIMESTAMP
                WHERE patreon_id = ?
              `).run(username, email, avatarUrl, safeAccessToken, safeRefreshToken, patreonTier, patreonId);

              user = await db.prepare('SELECT * FROM users WHERE patreon_id = ?').get(patreonId) as User;
            } else {
              // Create new user
              const result = await db.prepare(`
                INSERT INTO users (patreon_id, username, email, avatar_url, access_token, refresh_token, patreon_tier, role)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'user')
              `).run(patreonId, username, email, avatarUrl, safeAccessToken, safeRefreshToken, patreonTier);

              user = await db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
            }

            return done(null, user);
          } catch (error) {
            console.error('Patreon OAuth callback error:', error);
            return done(error, null);
          }
      }
    );

    strategy.name = 'patreon';
    strategy.userProfile = async (accessToken: string, done: (error: any, profile?: Profile) => void) => {
      try {
        const response = await axios.get<PatreonIdentityResponse>(
          'https://www.patreon.com/api/oauth2/v2/identity',
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: {
              include: 'memberships.currently_entitled_tiers',
              'fields[user]': 'full_name,email,image_url,thumb_url',
              'fields[member]': 'patron_status',
              'fields[tier]': 'title'
            }
          }
        );

        if (!response.data?.data?.id) {
          throw new Error('Patreon API v2 returned an invalid identity response');
        }

        const attributes = response.data.data.attributes || {};
        const profile: PatreonProfile = {
          provider: 'patreon',
          id: response.data.data.id,
          displayName: String(attributes.full_name || 'Patreon User'),
          emails: attributes.email ? [{ value: String(attributes.email) }] : undefined,
          photos: attributes.image_url || attributes.thumb_url
            ? [{ value: String(attributes.image_url || attributes.thumb_url) }]
            : undefined,
          _raw: JSON.stringify(response.data),
          _json: response.data,
          patreonTier: getPatreonTier(response.data)
        };

        done(null, profile);
      } catch (error) {
        console.error('Failed to fetch Patreon API v2 identity:', error);
        done(error);
      }
    };

    passport.use(strategy);

    console.log('✅ Patreon OAuth configured successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Failed to configure Patreon OAuth:', error.message);
    return false;
  }
};

configurePatreon();

export default passport;
export { configurePatreon };
