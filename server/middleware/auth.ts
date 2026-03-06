import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from '../database/db.js';

export interface JWTPayload {
  id: number;
  patreon_id: string;
  username: string;
  role: 'admin' | 'translator' | 'user';
  iat?: number;
  exp?: number;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = decoded as JWTPayload;
    next();
  });
};

export const authenticateTokenFlexible = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1];
  const queryToken = req.query.token as string | undefined;
  const token = headerToken || queryToken;

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = decoded as JWTPayload;
    next();
  });
};

export const requireRole = (...roles: Array<'admin' | 'translator' | 'user'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    next();
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, decoded) => {
    if (err) {
      req.user = null;
    } else {
      req.user = decoded as JWTPayload;
    }
    next();
  });
};

export const checkBan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    next();
    return;
  }

  try {
    const user = await db.prepare(`
      SELECT is_banned, ban_reason, ban_expires_at
      FROM users WHERE id = ?
    `).get(req.user.id) as any;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.is_banned) {
      if (user.ban_expires_at) {
        const expiryDate = new Date(user.ban_expires_at);
        if (new Date() > expiryDate) {
          await db.prepare(`
            UPDATE users
            SET is_banned = false, ban_reason = NULL, ban_expires_at = NULL, banned_at = NULL, banned_by = NULL
            WHERE id = ?
          `).run(req.user.id);
          next();
          return;
        }
      }

      res.status(403).json({
        error: 'Your account has been banned',
        reason: user.ban_reason,
        expiresAt: user.ban_expires_at
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error checking ban status:', error);
    next();
  }
};

export const requirePaidTier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role === 'admin') {
    next();
    return;
  }

  try {
    const user = await db.prepare('SELECT patreon_tier FROM users WHERE id = ?').get(req.user.id) as any;

    if (!user || user.patreon_tier === 'free' || !user.patreon_tier) {
      res.status(403).json({
        error: 'Premium Patreon tier required for direct downloads',
        requiresAdsense: true,
        message: 'Please upgrade your Patreon tier or watch an ad to download'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error checking paid tier:', error);
    res.status(500).json({ error: 'Failed to verify tier status' });
  }
};