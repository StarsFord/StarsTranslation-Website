import express from 'express';
import multer from 'multer';
import { db } from '../database/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const attachmentsDir = path.join(uploadsDir, 'attachments');
const imagesDir = path.join(uploadsDir, 'images');

[uploadsDir, attachmentsDir, imagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    cb(null, isImage ? imagesDir : attachmentsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '500000000') // 500MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for attachments
    cb(null, true);
  }
});

// Upload attachment (admin/translator only)
router.post('/attachment', authenticateToken, requireRole('admin', 'translator'), upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { post_id, version_id, attachment_type, description } = req.body;

    if (!post_id || !attachment_type) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Post ID and attachment type are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO attachments (post_id, version_id, filename, original_filename, file_path, file_size, mime_type, attachment_type, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      post_id,
      version_id || null,
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      attachment_type,
      description || null
    );

    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(attachment);
  } catch (error) {
    console.error('Error uploading attachment:', error);
    // Clean up file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

// Upload multiple attachments
router.post('/attachments', authenticateToken, requireRole('admin', 'translator'), upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { post_id, version_id, attachment_type, description } = req.body;

    if (!post_id || !attachment_type) {
      // Clean up uploaded files
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(400).json({ error: 'Post ID and attachment type are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO attachments (post_id, version_id, filename, original_filename, file_path, file_size, mime_type, attachment_type, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const attachments = req.files.map(file => {
      const result = stmt.run(
        post_id,
        version_id || null,
        file.filename,
        file.originalname,
        file.path,
        file.size,
        file.mimetype,
        attachment_type,
        description || null
      );

      return db.prepare('SELECT * FROM attachments WHERE id = ?').get(result.lastInsertRowid);
    });

    res.status(201).json(attachments);
  } catch (error) {
    console.error('Error uploading attachments:', error);
    // Clean up files on error
    if (req.files) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
    res.status(500).json({ error: 'Failed to upload attachments' });
  }
});

// Delete attachment (admin/translator only)
router.delete('/attachment/:id', authenticateToken, requireRole('admin', 'translator'), (req, res) => {
  try {
    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }

    // Delete from database
    db.prepare('DELETE FROM attachments WHERE id = ?').run(req.params.id);

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// Get attachment download URL
router.get('/attachment/:id', (req, res) => {
  try {
    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    res.download(attachment.file_path, attachment.original_filename);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
});

export default router;
