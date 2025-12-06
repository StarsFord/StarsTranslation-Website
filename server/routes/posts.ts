import express from 'express';
import { db } from '../database/db.js';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all posts with filters
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, translated, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        u.username as author_name,
        u.avatar_url as author_avatar,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT version_number FROM post_versions WHERE post_id = p.id ORDER BY created_at DESC LIMIT 1) as latest_version
      FROM posts p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.author_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (category) {
      query += ' AND c.slug = ?';
      params.push(category);
    }

    if (translated !== undefined) {
      query += ' AND p.is_translated = ?';
      params.push(translated === 'true' ? 1 : 0);
    }

    query += ' ORDER BY p.updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const posts = db.prepare(query).all(...params);

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post by ID (for editing)
router.get('/id/:id', authenticateToken, (req, res) => {
  try {
    const post = db.prepare(`
      SELECT
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        u.username as author_name,
        u.avatar_url as author_avatar
      FROM posts p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Parse external_links if it exists
    if (post.external_links) {
      try {
        post.external_links = JSON.parse(post.external_links);
      } catch (e) {
        post.external_links = [];
      }
    } else {
      post.external_links = [];
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Get single post by slug
router.get('/:slug', optionalAuth, (req, res) => {
  try {
    const post = db.prepare(`
      SELECT
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        u.username as author_name,
        u.avatar_url as author_avatar
      FROM posts p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.author_id = u.id
      WHERE p.slug = ?
    `).get(req.params.slug);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get versions
    const versions = db.prepare(`
      SELECT pv.*, u.username as created_by_name
      FROM post_versions pv
      JOIN users u ON pv.created_by = u.id
      WHERE pv.post_id = ?
      ORDER BY pv.created_at DESC
    `).all(post.id);

    // Get attachments
    const attachments = db.prepare(`
      SELECT * FROM attachments
      WHERE post_id = ?
      ORDER BY attachment_type, created_at DESC
    `).all(post.id);

    // Check if user is following
    let isFollowing = false;
    if (req.user) {
      const follow = db.prepare('SELECT id FROM post_followers WHERE user_id = ? AND post_id = ?')
        .get(req.user.id, post.id);
      isFollowing = !!follow;
    }

    // Parse external_links if it exists
    if (post.external_links) {
      try {
        post.external_links = JSON.parse(post.external_links);
      } catch (e) {
        post.external_links = [];
      }
    } else {
      post.external_links = [];
    }

    res.json({
      ...post,
      versions,
      attachments,
      isFollowing
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create new post (admin/translator only)
router.post('/', authenticateToken, requireRole('admin', 'translator'), (req, res) => {
  try {
    const { title, slug, description, content, category_id, is_translated, thumbnail_url, external_links } = req.body;

    if (!title || !slug || !category_id) {
      return res.status(400).json({ error: 'Title, slug, and category are required' });
    }

    // Stringify external_links if provided
    const linksJson = external_links ? JSON.stringify(external_links.filter((l: any) => l.label && l.url)) : null;

    const stmt = db.prepare(`
      INSERT INTO posts (title, slug, description, content, category_id, author_id, is_translated, thumbnail_url, external_links)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title,
      slug,
      description,
      content,
      category_id,
      req.user.id,
      is_translated ? 1 : 0,
      thumbnail_url,
      linksJson
    );

    console.log('✅ Post created with ID:', result.lastInsertRowid);

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);

    if (!post) {
      console.error('❌ Failed to retrieve created post. Last insert ID was:', result.lastInsertRowid);
      return res.status(500).json({ error: 'Post created but failed to retrieve' });
    }

    console.log('📄 Retrieved post:', post);
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    if (error.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ error: 'Post with this slug already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create post' });
    }
  }
});

// Update post (admin/translator only)
router.put('/:id', authenticateToken, requireRole('admin', 'translator'), (req, res) => {
  try {
    const { title, slug, description, content, category_id, is_translated, thumbnail_url, external_links } = req.body;

    // Stringify external_links if provided
    const linksJson = external_links ? JSON.stringify(external_links.filter((l: any) => l.label && l.url)) : null;

    const stmt = db.prepare(`
      UPDATE posts
      SET title = ?, slug = ?, description = ?, content = ?, category_id = ?, is_translated = ?, thumbnail_url = ?, external_links = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      title,
      slug,
      description,
      content,
      category_id,
      is_translated ? 1 : 0,
      thumbnail_url,
      linksJson,
      req.params.id
    );

    // Notify followers of update
    const followers = db.prepare('SELECT user_id FROM post_followers WHERE post_id = ?').all(req.params.id);

    const notifyStmt = db.prepare(`
      INSERT INTO notifications (user_id, post_id, message)
      VALUES (?, ?, ?)
    `);

    followers.forEach(follower => {
      notifyStmt.run(follower.user_id, req.params.id, `"${title}" has been updated`);
    });

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    res.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Add version to post
router.post('/:id/versions', authenticateToken, requireRole('admin', 'translator'), (req, res) => {
  try {
    const { version_number, changelog } = req.body;

    const stmt = db.prepare(`
      INSERT INTO post_versions (post_id, version_number, changelog, created_by)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(req.params.id, version_number, changelog, req.user.id);

    // Update post's updated_at
    db.prepare('UPDATE posts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);

    const version = db.prepare('SELECT * FROM post_versions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(version);
  } catch (error) {
    console.error('Error creating version:', error);
    res.status(500).json({ error: 'Failed to create version' });
  }
});

// Follow/Unfollow post
router.post('/:id/follow', authenticateToken, (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM post_followers WHERE user_id = ? AND post_id = ?')
      .get(req.user.id, req.params.id);

    if (existing) {
      db.prepare('DELETE FROM post_followers WHERE user_id = ? AND post_id = ?')
        .run(req.user.id, req.params.id);
      res.json({ following: false });
    } else {
      db.prepare('INSERT INTO post_followers (user_id, post_id) VALUES (?, ?)')
        .run(req.user.id, req.params.id);
      res.json({ following: true });
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ error: 'Failed to toggle follow' });
  }
});

export default router;
