import express, { Request, Response } from 'express';
import multer from 'multer';
import { db } from '../database/db.js';
import { authenticateToken, requireRole, checkBan } from '../middleware/auth.js';
import { uploadToCloudStorage, deleteFromCloudStorage } from '../services/storage.js';

const router = express.Router();

// Configure multer for memory storage (files will be uploaded to Cloud Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5368709120') // 5GB default
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for attachments
    cb(null, true);
  }
});

// Upload attachment (admin/translator only)
router.post('/attachment', authenticateToken, checkBan, requireRole('admin', 'translator'), upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { post_id, version_id, attachment_type, description } = req.body;

    if (!post_id || !attachment_type) {
      res.status(400).json({ error: 'Post ID and attachment type are required' });
      return;
    }

    // Determine folder based on attachment type
    const folder = attachment_type === 'image' ? 'images' : 'attachments';

    // Upload to Cloud Storage
    console.log(`Uploading ${req.file.originalname} to Cloud Storage...`);
    const uploadResult = await uploadToCloudStorage(req.file, folder);

    // Save to database
    const stmt = await db.prepare(`
      INSERT INTO attachments (post_id, version_id, filename, original_filename, file_path, file_size, mime_type, attachment_type, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = await stmt.run(
      post_id,
      version_id || null,
      uploadResult.filename,
      uploadResult.originalFilename,
      uploadResult.url, // Store public URL instead of local path
      uploadResult.size,
      uploadResult.mimetype,
      attachment_type,
      description || null
    );

    const attachment = await db.prepare('SELECT * FROM attachments WHERE id = ?').get(result.lastInsertRowid);

    console.log(`✅ File uploaded successfully: ${uploadResult.url}`);
    res.status(201).json(attachment);
  } catch (error: any) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ error: 'Failed to upload attachment: ' + error.message });
  }
});

// Upload multiple attachments
router.post('/attachments', authenticateToken, checkBan, requireRole('admin', 'translator'), upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const { post_id, version_id, attachment_type, description } = req.body;

    if (!post_id || !attachment_type) {
      res.status(400).json({ error: 'Post ID and attachment type are required' });
      return;
    }

    const folder = attachment_type === 'image' ? 'images' : 'attachments';

    const stmt = await db.prepare(`
      INSERT INTO attachments (post_id, version_id, filename, original_filename, file_path, file_size, mime_type, attachment_type, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const attachments: any[] = [];

    for (const file of req.files) {
      try {
        console.log(`Uploading ${file.originalname} to Cloud Storage...`);
        const uploadResult = await uploadToCloudStorage(file, folder);

        const result = await stmt.run(
          post_id,
          version_id || null,
          uploadResult.filename,
          uploadResult.originalFilename,
          uploadResult.url,
          uploadResult.size,
          uploadResult.mimetype,
          attachment_type,
          description || null
        );

        const attachment = await db.prepare('SELECT * FROM attachments WHERE id = ?').get(result.lastInsertRowid);
        attachments.push(attachment);
        console.log(`✅ File uploaded: ${uploadResult.url}`);
      } catch (error) {
        console.error(`Failed to upload ${file.originalname}:`, error);
        // Continue with other files even if one fails
      }
    }

    if (attachments.length === 0) {
      res.status(500).json({ error: 'All file uploads failed' });
      return;
    }

    res.status(201).json(attachments);
  } catch (error: any) {
    console.error('Error uploading attachments:', error);
    res.status(500).json({ error: 'Failed to upload attachments: ' + error.message });
  }
});

// Delete attachment (admin/translator only)
router.delete('/attachment/:id', authenticateToken, checkBan, requireRole('admin', 'translator'), async (req: Request, res: Response) => {
  try {
    const attachment: any = await db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);

    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    // Extract filepath from URL
    // URL format: https://storage.googleapis.com/bucket-name/folder/filename.ext
    // We need: folder/filename.ext
    try {
      const url = new URL(attachment.file_path);
      const filepath = url.pathname.split('/').slice(2).join('/'); // Remove bucket name

      await deleteFromCloudStorage(filepath);
      console.log(`✅ File deleted from Cloud Storage: ${filepath}`);
    } catch (error) {
      console.error('Error deleting file from Cloud Storage:', error);
      // Continue to delete from database even if Cloud Storage delete fails
    }

    // Delete from database
    await db.prepare('DELETE FROM attachments WHERE id = ?').run(req.params.id);

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment: ' + error.message });
  }
});

// Get attachment download URL
router.get('/attachment/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const attachment: any = await db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);

    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    // Verificar tipo de attachment
    if (attachment.attachment_type === 'translated' || attachment.attachment_type === 'original') {
      // Admin sempre tem acesso direto
      if (req.user.role === 'admin') {
        console.log(`✅ Admin download: ${attachment.original_filename}`);
        res.redirect(attachment.file_path);
        return;
      }

      // Verificar tier pago do usuário
      const user = await db.prepare('SELECT patreon_tier FROM users WHERE id = ?').get(req.user.id) as any;
      
      if (user && user.patreon_tier && user.patreon_tier !== 'free') {
        // Usuário tem tier pago - download direto
        console.log(`✅ Premium download (${user.patreon_tier}): ${attachment.original_filename}`);
        res.redirect(attachment.file_path);
        return;
      }

      // Usuário free - requer AdSense
      console.log(`⚠️ Free user download attempt: ${attachment.original_filename}`);
      res.status(403).json({
        requiresAdsense: true,
        downloadUrl: attachment.file_path,
        attachmentId: attachment.id,
        fileName: attachment.original_filename,
        message: 'Premium tier required for direct download. Please watch an ad or upgrade your Patreon tier.'
      });
      return;
    }

    // Imagens são sempre públicas
    res.redirect(attachment.file_path);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
});

// Get attachment info for AdSense page (without download)
router.get('/adsense-info/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const attachment: any = await db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);

    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    // Retornar apenas informações do arquivo, sem URL de download
    res.json({
      id: attachment.id,
      fileName: attachment.original_filename,
      fileSize: attachment.file_size,
      mimeType: attachment.mime_type,
      attachmentType: attachment.attachment_type
    });
  } catch (error) {
    console.error('Error getting attachment info:', error);
    res.status(500).json({ error: 'Failed to get attachment info' });
  }
});

// Generate temporary download token
router.post('/generate-download-token/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const attachment: any = await db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);

    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    // Gerar token temporário (válido por 5 minutos)
    const token = Buffer.from(
      `${attachment.id}-${req.user.id}-${Date.now() + 5 * 60 * 1000}`
    ).toString('base64');

    console.log(`✅ Generated download token for ${attachment.original_filename}`);
    
    res.json({ token });
  } catch (error) {
    console.error('Error generating download token:', error);
    res.status(500).json({ error: 'Failed to generate download token' });
  }
});

// Download with temporary token
router.get('/download-with-token/:id', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Token required' });
      return;
    }

    // Decodificar e validar token
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [attachmentId, userId, expiryTime] = decoded.split('-');

      if (parseInt(attachmentId) !== parseInt(String(req.params.id))) {
        res.status(403).json({ error: 'Invalid token for this file' });
        return;
      }

      if (Date.now() > parseInt(expiryTime)) {
        res.status(403).json({ error: 'Token expired. Please generate a new one.' });
        return;
      }

      const attachment: any = await db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);

      if (!attachment) {
        res.status(404).json({ error: 'Attachment not found' });
        return;
      }

      console.log(`✅ Token download: ${attachment.original_filename} by user ${userId}`);
      res.redirect(attachment.file_path);
    } catch (error) {
      console.error('Invalid token format:', error);
      res.status(403).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error downloading with token:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

export default router;
