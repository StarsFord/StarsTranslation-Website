import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from '../database/db.js';
import type { User } from '../types/database.js';

interface JWTPayload {
  id: number;
  patreon_id: string;
  username: string;
  role: 'admin' | 'translator' | 'user';
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload | null;
    }
  }
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

// Check if user is banned
export const checkBan = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    next();
    return;
  }

  try {
    const user = db.prepare(`
      SELECT is_banned, ban_reason, ban_expires_at
      FROM users
      WHERE id = ?
    `).get(req.user.id) as any;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if user is banned
    if (user.is_banned) {
      // Check if ban has expired
      if (user.ban_expires_at) {
        const expiryDate = new Date(user.ban_expires_at);
        const now = new Date();

        if (now > expiryDate) {
          // Ban expired, unban the user
          db.prepare(`
            UPDATE users
            SET is_banned = 0, ban_reason = NULL, ban_expires_at = NULL, banned_at = NULL, banned_by = NULL
            WHERE id = ?
          `).run(req.user.id);

          next();
          return;
        }
      }

      // User is still banned
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
