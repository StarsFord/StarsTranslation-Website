import express, { Request, Response } from 'express';
import passport from '../config/passport.js';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../database/db.js';
import type { User } from '../types/database.js';

const router = express.Router();

// Patreon OAuth login
router.get('/patreon', passport.authenticate('patreon'));

// Patreon OAuth callback
router.get(
  '/patreon/callback',
  passport.authenticate('patreon', {
    failureRedirect: `${process.env.BACKEND_URL}/login?error=auth_failed`
  }),
  async (req: Request, res: Response) => {
    const user = req.user as User;

    // Buscar informações de tier do Patreon
    let patronTier = 'free';
    try {
      // A estratégia do passport já deve ter as informações do perfil
      // Vamos atualizar o tier baseado nos dados do Patreon
      const patreonProfile = (req.user as any).patreonProfile;
      
      if (patreonProfile?.included) {
        // Buscar pelo membership ativo
        const membership = patreonProfile.included.find(
          (item: any) => item.type === 'member' && item.attributes?.patron_status === 'active_patron'
        );

        if (membership) {
          // Buscar tier associado
          const tierRelationship = membership.relationships?.currently_entitled_tiers?.data;
          if (tierRelationship && tierRelationship.length > 0) {
            // Usuário tem tier pago
            const tierId = tierRelationship[0].id;
            const tier = patreonProfile.included.find((item: any) => item.type === 'tier' && item.id === tierId);
            
            if (tier) {
              // Tier pago encontrado
              patronTier = tier.attributes?.title || 'paid';
              console.log(`✅ Patreon tier detected: ${patronTier}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Patreon tier:', error);
      // Se falhar, mantém como 'free'
    }

    // Atualizar tier no banco de dados
    try {
      db.prepare('UPDATE users SET patreon_tier = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(patronTier, user.id);
      console.log(`✅ User ${user.username} tier updated to: ${patronTier}`);
    } catch (error) {
      console.error('Error updating user tier:', error);
    }

    const token = jwt.sign(
      {
        id: user.id,
        patreon_id: user.patreon_id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    res.redirect(`${process.env.BACKEND_URL}/auth/callback?token=${token}`);
  }
);

// Get current user
router.get('/me', authenticateToken, (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  // Fetch full user data from database
  const user = db.prepare('SELECT id, username, email, avatar_url, role, patreon_tier FROM users WHERE id = ?').get(req.user.id) as any;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    avatar_url: user.avatar_url,
    role: user.role,
    patreon_tier: user.patreon_tier || 'free'
  });
});

// Logout
router.post('/logout', authenticateToken, (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

// Development login (only works if Patreon OAuth is not configured)
if (!process.env.PATREON_CLIENT_ID || !process.env.PATREON_CLIENT_SECRET) {
  router.post('/dev-login', (req: Request, res: Response) => {
    try {
      const { username } = req.body;

      if (!username) {
        res.status(400).json({ error: 'Username required' });
        return;
      }

      let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | null;

      if (!user) {
        const stmt = db.prepare(`
          INSERT INTO users (patreon_id, username, email, role)
          VALUES (?, ?, ?, 'admin')
        `);
        const result = stmt.run(`dev-${Date.now()}`, username, `${username}@dev.local`);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
      }

      const token = jwt.sign(
        {
          id: user.id,
          patreon_id: user.patreon_id,
          username: user.username,
          role: user.role
        },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Dev login error:', error);
      res.status(500).json({ error: 'Failed to create dev user' });
    }
  });

  console.log('🔧 Development mode: /auth/dev-login endpoint available');
}

export default router;
