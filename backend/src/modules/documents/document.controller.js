import * as documentService from './document.service.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

// ==================== DOCUMENT CONTROLLERS ====================

export async function createDocumentController(req, res) {
  try {
    const document = await documentService.createDocument(req.body, req.user);
    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function listDocumentsController(req, res) {
  try {
    const filters = {
      folderId: req.query.folderId,
      status: req.query.status,
      isTemplate: req.query.isTemplate === 'true' ? true : req.query.isTemplate === 'false' ? false : undefined,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      search: req.query.search,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await documentService.listDocuments(filters, req.user);
    res.json(result);
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function getDocumentController(req, res) {
  try {
    const document = await documentService.getDocument(req.params.id, req.user);
    res.json(document);
  } catch (error) {
    console.error('Error getting document:', error);
    res.status(404).json({ error: error.message });
  }
}

export async function updateDocumentController(req, res) {
  try {
    const document = await documentService.updateDocument(req.params.id, req.body, req.user);
    res.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function deleteDocumentController(req, res) {
  try {
    const permanent = req.query.permanent === 'true';
    const result = await documentService.deleteDocument(req.params.id, req.user, permanent);
    res.json(result);
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function restoreDocumentController(req, res) {
  try {
    const document = await documentService.restoreDocument(req.params.id, req.user);
    res.json(document);
  } catch (error) {
    console.error('Error restoring document:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function getDocumentStatisticsController(req, res) {
  try {
    const statistics = await documentService.getDocumentStatistics(req.user);
    res.json(statistics);
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(400).json({ error: error.message });
  }
}

// ==================== FILE UPLOAD CONTROLLERS ====================

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'src', 'modules', 'documents', 'uploads', req.user.tenantId);
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Add file type validation if needed
    cb(null, true);
  }
});

export const uploadMiddleware = upload.single('file');

export async function uploadDocumentController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const documentData = {
      folderId: req.body.folderId || null,
      name: req.body.name || req.file.originalname,
      description: req.body.description,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      storagePath: req.file.path,
      storageProvider: 'LOCAL',
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {},
      isTemplate: req.body.isTemplate === 'true',
      templateId: req.body.templateId || null
    };

    const document = await documentService.createDocument(documentData, req.user);
    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(400).json({ error: error.message });
  }
}

export async function downloadDocumentController(req, res) {
  try {
    const document = await documentService.getDocument(req.params.id, req.user);

    // Check if file exists
    try {
      await fs.access(document.storagePath);
    } catch {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Increment download count
    await documentService.updateDocument(
      req.params.id,
      { downloadCount: document.downloadCount + 1 },
      req.user
    );

    // Log activity
    await documentService.logDocumentActivity({
      documentId: document.id,
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'DOWNLOADED'
    });

    // Send file
    res.download(document.storagePath, document.fileName);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(400).json({ error: error.message });
  }
}

// ==================== VERSION CONTROLLERS ====================

export async function createDocumentVersionController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const versionData = {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      storagePath: req.file.path,
      changeLog: req.body.changeLog
    };

    const version = await documentService.createDocumentVersion(
      req.params.id,
      versionData,
      req.user
    );

    res.status(201).json(version);
  } catch (error) {
    console.error('Error creating version:', error);
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(400).json({ error: error.message });
  }
}

export async function getDocumentVersionsController(req, res) {
  try {
    const versions = await documentService.getDocumentVersions(req.params.id, req.user);
    res.json(versions);
  } catch (error) {
    console.error('Error getting versions:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function revertToVersionController(req, res) {
  try {
    const result = await documentService.revertToVersion(
      req.params.id,
      parseInt(req.params.versionNumber),
      req.user
    );
    res.json(result);
  } catch (error) {
    console.error('Error reverting version:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function downloadVersionController(req, res) {
  try {
    const versions = await documentService.getDocumentVersions(req.params.id, req.user);
    const version = versions.find(v => v.versionNumber === parseInt(req.params.versionNumber));

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Check if file exists
    try {
      await fs.access(version.storagePath);
    } catch {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Send file
    res.download(version.storagePath, version.fileName);
  } catch (error) {
    console.error('Error downloading version:', error);
    res.status(400).json({ error: error.message });
  }
}

// ==================== FOLDER CONTROLLERS ====================

export async function createFolderController(req, res) {
  try {
    const folder = await documentService.createFolder(req.body, req.user);
    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function listFoldersController(req, res) {
  try {
    const filters = {
      parentId: req.query.parentId,
      search: req.query.search
    };
    const folders = await documentService.listFolders(filters, req.user);
    res.json(folders);
  } catch (error) {
    console.error('Error listing folders:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function getFolderController(req, res) {
  try {
    const folder = await documentService.getFolder(req.params.id, req.user);
    res.json(folder);
  } catch (error) {
    console.error('Error getting folder:', error);
    res.status(404).json({ error: error.message });
  }
}

export async function updateFolderController(req, res) {
  try {
    const folder = await documentService.updateFolder(req.params.id, req.body, req.user);
    res.json(folder);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function deleteFolderController(req, res) {
  try {
    const permanent = req.query.permanent === 'true';
    const result = await documentService.deleteFolder(req.params.id, req.user, permanent);
    res.json(result);
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(400).json({ error: error.message });
  }
}

// ==================== SHARING CONTROLLERS ====================

export async function createDocumentShareController(req, res) {
  try {
    const share = await documentService.createDocumentShare(req.params.id, req.body, req.user);
    res.status(201).json(share);
  } catch (error) {
    console.error('Error creating share:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function listDocumentSharesController(req, res) {
  try {
    const shares = await documentService.listDocumentShares(req.params.id, req.user);
    res.json(shares);
  } catch (error) {
    console.error('Error listing shares:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function revokeDocumentShareController(req, res) {
  try {
    const result = await documentService.revokeDocumentShare(req.params.shareId, req.user);
    res.json(result);
  } catch (error) {
    console.error('Error revoking share:', error);
    res.status(400).json({ error: error.message });
  }
}

// ==================== PERMISSION CONTROLLERS ====================

export async function setDocumentPermissionsController(req, res) {
  try {
    const result = await documentService.setDocumentPermissions(
      req.params.id,
      req.body.permissions,
      req.user
    );
    res.json(result);
  } catch (error) {
    console.error('Error setting permissions:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function setFolderPermissionsController(req, res) {
  try {
    const result = await documentService.setFolderPermissions(
      req.params.id,
      req.body.permissions,
      req.user
    );
    res.json(result);
  } catch (error) {
    console.error('Error setting folder permissions:', error);
    res.status(400).json({ error: error.message });
  }
}

// ==================== TEMPLATE CONTROLLERS ====================

export async function createDocumentTemplateController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const templateData = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      fileName: req.file.originalname,
      storagePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fields: req.body.fields ? JSON.parse(req.body.fields) : []
    };

    const template = await documentService.createDocumentTemplate(templateData, req.user);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(400).json({ error: error.message });
  }
}

export async function listDocumentTemplatesController(req, res) {
  try {
    const filters = {
      category: req.query.category,
      search: req.query.search,
      isActive: req.query.isActive !== 'false'
    };
    const templates = await documentService.listDocumentTemplates(filters, req.user);
    res.json(templates);
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(400).json({ error: error.message });
  }
}

export async function generateFromTemplateController(req, res) {
  try {
    const result = await documentService.generateFromTemplate(
      req.params.id,
      req.body.data,
      req.user
    );
    res.json(result);
  } catch (error) {
    console.error('Error generating from template:', error);
    res.status(400).json({ error: error.message });
  }
}

// ==================== ACTIVITY CONTROLLERS ====================

export async function getDocumentActivitiesController(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const activities = await documentService.getDocumentActivities(
      req.params.id,
      req.user,
      limit
    );
    res.json(activities);
  } catch (error) {
    console.error('Error getting activities:', error);
    res.status(400).json({ error: error.message });
  }
}
