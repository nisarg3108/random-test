import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ],
  archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
  video: ['video/mp4', 'video/mpeg', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg']
};

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_FILE_TYPES.image,
  ...ALLOWED_FILE_TYPES.document,
  ...ALLOWED_FILE_TYPES.archive,
  ...ALLOWED_FILE_TYPES.video,
  ...ALLOWED_FILE_TYPES.audio
];

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    UPLOAD_DIR,
    path.join(UPLOAD_DIR, 'messages'),
    path.join(UPLOAD_DIR, 'announcements'),
    path.join(UPLOAD_DIR, 'temp')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureUploadDirs();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = req.body.type || 'temp';
    const uploadPath = path.join(UPLOAD_DIR, subDir);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${sanitizedName}_${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (ALL_ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not supported. Allowed types: images, documents, archives, audio, video.`), false);
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5 // Max 5 files per upload
  }
});

// File Upload Service
class FileUploadService {
  /**
   * Get file type category from MIME type
   */
  getFileCategory(mimetype) {
    for (const [category, types] of Object.entries(ALLOWED_FILE_TYPES)) {
      if (types.includes(mimetype)) {
        return category;
      }
    }
    return 'other';
  }

  /**
   * Process uploaded files and return metadata
   */
  processUploadedFiles(files, tenantId, userId) {
    if (!files || files.length === 0) {
      return [];
    }

    return files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      category: this.getFileCategory(file.mimetype),
      path: file.path,
      url: `/api/communication/files/${file.filename}`,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString()
    }));
  }

  /**
   * Delete a file from the filesystem
   */
  async deleteFile(filename) {
    try {
      // Search in all subdirectories
      const searchDirs = ['messages', 'announcements', 'temp'];
      
      for (const dir of searchDirs) {
        const filePath = path.join(UPLOAD_DIR, dir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          return { success: true, message: 'File deleted successfully' };
        }
      }
      
      return { success: false, message: 'File not found' };
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(filenames) {
    const results = await Promise.allSettled(
      filenames.map(filename => this.deleteFile(filename))
    );
    
    return results.map((result, index) => ({
      filename: filenames[index],
      success: result.status === 'fulfilled' && result.value.success,
      error: result.status === 'rejected' ? result.reason.message : null
    }));
  }

  /**
   * Get file from filesystem
   */
  getFile(filename) {
    const searchDirs = ['messages', 'announcements', 'temp'];
    
    for (const dir of searchDirs) {
      const filePath = path.join(UPLOAD_DIR, dir, filename);
      if (fs.existsSync(filePath)) {
        return {
          path: filePath,
          exists: true
        };
      }
    }
    
    return {
      path: null,
      exists: false
    };
  }

  /**
   * Get file stats (size, date, etc.)
   */
  getFileStats(filename) {
    const file = this.getFile(filename);
    if (!file.exists) {
      return null;
    }
    
    const stats = fs.statSync(file.path);
    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
  }

  /**
   * Clean up temporary files older than 24 hours
   */
  async cleanupTempFiles() {
    try {
      const tempDir = path.join(UPLOAD_DIR, 'temp');
      const files = fs.readdirSync(tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
      
      return { success: true, deletedCount };
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate file attachments array
   */
  validateAttachments(attachments) {
    if (!Array.isArray(attachments)) {
      return false;
    }
    
    for (const attachment of attachments) {
      if (!attachment.filename || !attachment.originalName || !attachment.mimetype || !attachment.size) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get total storage used by tenant
   */
  async getTenantStorageUsage(tenantId) {
    // This would require storing tenantId with files or in database
    // For now, return a placeholder
    return {
      totalBytes: 0,
      totalFiles: 0,
      message: 'Storage tracking requires database integration'
    };
  }
}

export default new FileUploadService();
