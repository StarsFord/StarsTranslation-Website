import express, { Request, Response } from 'express';
import { db } from '../database/db.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get comments for a post
router.get('/post/:postId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const comments = await db.prepare(`
      SELECT
        c.*,
        u.username,
        u.avatar_url,
        u.role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(req.params.postId);

    // Build threaded comments structure
    const commentMap: Record<number, any> = {};
    const rootComments: any[] = [];

    comments.forEach((comment: any) => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    comments.forEach((comment: any) => {
      if (comment.parent_id) {
        if (commentMap[comment.parent_id]) {
          commentMap[comment.parent_id].replies.push(commentMap[comment.id]);
        }
      } else {
        rootComments.push(commentMap[comment.id]);
      }
    });

    res.json(rootComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create comment (authenticated users only)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { post_id, parent_id, content } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!post_id || !content) {
      return res.status(400).json({ error: 'Post ID and content are required' });
    }

    const stmt = await db.prepare(`
      INSERT INTO comments (post_id, user_id, parent_id, content)
      VALUES (?, ?, ?, ?)
    `);

    const result = await stmt.run(post_id, req.user.id, parent_id || null, content);

    const comment = await db.prepare(`
      SELECT
        c.*,
        u.username,
        u.avatar_url,
        u.role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Update comment (author only)
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { content } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this comment' });
    }

    db.prepare(`
      UPDATE comments
      SET content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(content, req.params.id);

    const updatedComment = db.prepare(`
      SELECT
        c.*,
        u.username,
        u.avatar_url,
        u.role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(req.params.id);

    res.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete comment (author or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const comment = await db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
