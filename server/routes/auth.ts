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
    failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`
  }),
  (req: Request, res: Response) => {
    const user = req.user as User;

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

    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

// Get current user
router.get('/me', authenticateToken, (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  // Fetch full user data from database
  const user = db.prepare('SELECT id, username, email, avatar_url, role FROM users WHERE id = ?').get(req.user.id) as User | null;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    avatar_url: user.avatar_url,
    role: user.role
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
