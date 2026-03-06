import express, { Request, Response } from 'express';
import { db } from '../database/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const users = await db.prepare(`
      SELECT
        id, patreon_id, username, email, avatar_url, role,
        is_banned, ban_reason, ban_expires_at, banned_at,
        created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role (admin only)
router.put('/:id/role', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!['user', 'translator', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    // Prevent demoting yourself
    if ((req as any).user.id === parseInt(String(userId))) {
      res.status(400).json({ error: 'Cannot change your own role' });
      return;
    }

    await db.prepare(`
      UPDATE users
      SET role = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(role, userId);

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    res.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Ban user (admin only)
router.post('/:id/ban', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { reason, duration } = req.body; // duration in days, null for permanent
    const userId = req.params.id;
    const adminId = (req as any).user.id;

    // Prevent banning yourself
    if (adminId === parseInt(String(userId))) {
      res.status(400).json({ error: 'Cannot ban yourself' });
      return;
    }

    let banExpiresAt: string | null = null;
    if (duration && duration > 0) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + duration);
      banExpiresAt = expiryDate.toISOString();
    }

    await db.prepare(`
      UPDATE users
      SET
        is_banned = 1,
        ban_reason = ?,
        ban_expires_at = ?,
        banned_at = CURRENT_TIMESTAMP,
        banned_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reason || 'No reason provided', banExpiresAt, adminId, userId);

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    res.json(user);
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// Unban user (admin only)
router.post('/:id/unban', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    await db.prepare(`
      UPDATE users
      SET
        is_banned = 0,
        ban_reason = NULL,
        ban_expires_at = NULL,
        banned_at = NULL,
        banned_by = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(userId);

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    res.json(user);
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// Get pending posts (admin only)
router.get('/pending-posts', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const posts = await db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
      u.username as author_name, u.avatar_url as author_avatar
      FROM posts p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.author_id = u.id
      WHERE p.status = 'pending'
      ORDER BY p.created_at DESC
    `).all();

    res.json(posts);
  } catch (error) {
    console.error('Error fetching pending posts:', error);
    res.status(500).json({ error: 'Failed to fetch pending posts' });
  }
});

// Approve post (admin only)
router.post('/posts/:id/approve', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;
    const adminId = (req as any).user.id;

    await db.prepare(`
      UPDATE posts
      SET
        status = 'published',
        reviewed_by = ?,
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(adminId, postId);

    const post = await db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    res.json(post);
  } catch (error) {
    console.error('Error approving post:', error);
    res.status(500).json({ error: 'Failed to approve post' });
  }
});

// Reject post (admin only)
router.post('/posts/:id/reject', authenticateToken, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;
    const adminId = (req as any).user.id;
    const { reason } = req.body;

    await db.prepare(`
      UPDATE posts
      SET
        status = 'rejected',
        reviewed_by = ?,
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(adminId, postId);

    // Could send notification to author with rejection reason
    // For now, just update the post status

    const post = await db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    res.json(post);
  } catch (error) {
    console.error('Error rejecting post:', error);
    res.status(500).json({ error: 'Failed to reject post' });
  }
});

export default router;
