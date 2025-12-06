import express, { Request, Response } from 'express';
import { db } from '../database/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all tag types
router.get('/types', (req: Request, res: Response) => {
  try {
    const tagTypes = db.prepare('SELECT * FROM tag_types ORDER BY name').all();
    res.json(tagTypes);
  } catch (error) {
    console.error('Error fetching tag types:', error);
    res.status(500).json({ error: 'Failed to fetch tag types' });
  }
});

// Get all tags (optionally filtered by type)
router.get('/', (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    let query = `
      SELECT t.*, tt.name as type_name, tt.slug as type_slug
      FROM tags t
      JOIN tag_types tt ON t.tag_type_id = tt.id
    `;

    const params: any[] = [];

    if (type) {
      query += ' WHERE tt.slug = ?';
      params.push(type);
    }

    query += ' ORDER BY tt.name, t.name';

    const tags = db.prepare(query).all(...params);
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Get tags for a specific post
router.get('/post/:postId', (req: Request, res: Response) => {
  try {
    const tags = db.prepare(`
      SELECT t.*, tt.name as type_name, tt.slug as type_slug
      FROM tags t
      JOIN post_tags pt ON t.id = pt.tag_id
      JOIN tag_types tt ON t.tag_type_id = tt.id
      WHERE pt.post_id = ?
      ORDER BY tt.name, t.name
    `).all(req.params.postId);

    res.json(tags);
  } catch (error) {
    console.error('Error fetching post tags:', error);
    res.status(500).json({ error: 'Failed to fetch post tags' });
  }
});

// Create new tag (admin only)
router.post('/', authenticateToken, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const { tag_type_id, name, description } = req.body;

    if (!tag_type_id || !name) {
      res.status(400).json({ error: 'Tag type and name are required' });
      return;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const result = db.prepare(`
      INSERT INTO tags (tag_type_id, name, slug, description)
      VALUES (?, ?, ?, ?)
    `).run(tag_type_id, name, slug, description || null);

    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(tag);
  } catch (error: any) {
    console.error('Error creating tag:', error);
    if (error.message?.includes('UNIQUE constraint')) {
      res.status(400).json({ error: 'Tag already exists for this type' });
    } else {
      res.status(500).json({ error: 'Failed to create tag' });
    }
  }
});

// Update tag (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined;

    if (name) {
      db.prepare(`
        UPDATE tags
        SET name = ?, slug = ?, description = ?
        WHERE id = ?
      `).run(name, slug, description || null, req.params.id);
    } else {
      db.prepare(`
        UPDATE tags
        SET description = ?
        WHERE id = ?
      `).run(description || null, req.params.id);
    }

    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id);
    res.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// Delete tag (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// Add tag to post (admin/translator only)
router.post('/post/:postId', authenticateToken, requireRole('admin', 'translator'), (req: Request, res: Response) => {
  try {
    const { tag_id } = req.body;

    if (!tag_id) {
      res.status(400).json({ error: 'Tag ID is required' });
      return;
    }

    db.prepare(`
      INSERT OR IGNORE INTO post_tags (post_id, tag_id)
      VALUES (?, ?)
    `).run(req.params.postId, tag_id);

    res.json({ message: 'Tag added to post' });
  } catch (error) {
    console.error('Error adding tag to post:', error);
    res.status(500).json({ error: 'Failed to add tag to post' });
  }
});

// Remove tag from post (admin/translator only)
router.delete('/post/:postId/:tagId', authenticateToken, requireRole('admin', 'translator'), (req: Request, res: Response) => {
  try {
    db.prepare(`
      DELETE FROM post_tags
      WHERE post_id = ? AND tag_id = ?
    `).run(req.params.postId, req.params.tagId);

    res.json({ message: 'Tag removed from post' });
  } catch (error) {
    console.error('Error removing tag from post:', error);
    res.status(500).json({ error: 'Failed to remove tag from post' });
  }
});

// Search posts by tags
router.get('/search', (req: Request, res: Response) => {
  try {
    const { query, platform, genre, fetish } = req.query;

    let sql = `
      SELECT DISTINCT p.*, COUNT(DISTINCT pt.tag_id) as matching_tags
      FROM posts p
      LEFT JOIN post_tags pt ON p.id = pt.post_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      LEFT JOIN tag_types tt ON t.tag_type_id = tt.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (query) {
      sql += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.content LIKE ?)';
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (platform || genre || fetish) {
      sql += ' AND (';
      const conditions: string[] = [];

      if (platform) {
        conditions.push('(tt.slug = ? AND t.slug = ?)');
        params.push('platform', platform);
      }
      if (genre) {
        conditions.push('(tt.slug = ? AND t.slug = ?)');
        params.push('genre', genre);
      }
      if (fetish) {
        conditions.push('(tt.slug = ? AND t.slug = ?)');
        params.push('fetish', fetish);
      }

      sql += conditions.join(' OR ');
      sql += ')';
    }

    sql += ' GROUP BY p.id ORDER BY matching_tags DESC, p.updated_at DESC';

    const posts = db.prepare(sql).all(...params);

    res.json(posts);
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

export default router;
