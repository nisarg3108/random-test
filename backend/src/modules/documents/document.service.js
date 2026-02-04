import prisma from '../../config/db.js';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

// ==================== DOCUMENT CRUD ====================

export async function createDocument(data, user) {
  const { 
    folderId, 
    name, 
    description, 
    fileName, 
    fileSize, 
    mimeType, 
    storagePath,
    storageProvider = 'LOCAL',
    tags = [],
    metadata = {},
    isTemplate = false,
    templateId = null
  } = data;

  // Calculate checksum for file integrity
  const checksum = await calculateChecksum(storagePath);

  // Build folder path if folderId provided
  let folder = null;
  if (folderId) {
    folder = await prisma.documentFolder.findUnique({
      where: { id: folderId },
      select: { tenantId: true, path: true }
    });

    if (!folder || folder.tenantId !== user.tenantId) {
      throw new Error('Folder not found');
    }
  }

  const document = await prisma.document.create({
    data: {
      tenantId: user.tenantId,
      folderId,
      name,
      description,
      fileName,
      fileSize,
      mimeType,
      storagePath,
      storageProvider,
      checksum,
      tags,
      metadata,
      isTemplate,
      templateId,
      version: 1,
      isLatest: true,
      createdBy: user.id
    },
    include: {
      folder: {
        select: { name: true, path: true }
      }
    }
  });

  // Create initial version
  await prisma.documentVersion.create({
    data: {
      documentId: document.id,
      versionNumber: 1,
      fileName,
      fileSize,
      storagePath,
      checksum,
      changeLog: 'Initial version',
      createdBy: user.id
    }
  });

  // Log activity
  await logDocumentActivity({
    documentId: document.id,
    tenantId: user.tenantId,
    userId: user.id,
    action: 'CREATED',
    details: { name, fileName }
  });

  return document;
}

export async function listDocuments(filters, user) {
  const {
    folderId,
    status = 'ACTIVE',
    isTemplate,
    tags,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 50
  } = filters;

  const where = {
    tenantId: user.tenantId,
    status
  };

  if (folderId !== undefined) {
    where.folderId = folderId;
  }

  if (isTemplate !== undefined) {
    where.isTemplate = isTemplate;
  }

  if (tags && tags.length > 0) {
    where.tags = {
      hasSome: tags
    };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { fileName: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        folder: {
          select: { id: true, name: true, path: true }
        },
        _count: {
          select: {
            versions: true,
            shares: true,
            comments: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.document.count({ where })
  ]);

  return {
    documents,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

export async function getDocument(documentId, user) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      tenantId: user.tenantId
    },
    include: {
      folder: {
        select: { id: true, name: true, path: true }
      },
      template: {
        select: { id: true, name: true, category: true }
      },
      versions: {
        orderBy: { versionNumber: 'desc' },
        take: 10
      },
      shares: {
        where: { isActive: true },
        select: {
          id: true,
          shareType: true,
          shareToken: true,
          expiresAt: true,
          sharedWith: true,
          canView: true,
          canDownload: true,
          canEdit: true,
          createdAt: true
        }
      },
      permissions: {
        select: {
          userId: true,
          roleId: true,
          canView: true,
          canEdit: true,
          canDelete: true,
          canShare: true,
          canManage: true
        }
      },
      _count: {
        select: {
          versions: true,
          shares: true,
          comments: true,
          activities: true
        }
      }
    }
  });

  if (!document) {
    throw new Error('Document not found');
  }

  // Increment view count
  await prisma.document.update({
    where: { id: documentId },
    data: { viewCount: { increment: 1 } }
  });

  // Log activity
  await logDocumentActivity({
    documentId: document.id,
    tenantId: user.tenantId,
    userId: user.id,
    action: 'VIEWED'
  });

  return document;
}

export async function updateDocument(documentId, data, user) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      tenantId: user.tenantId
    }
  });

  if (!document) {
    throw new Error('Document not found');
  }

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      ...data,
      updatedBy: user.id
    },
    include: {
      folder: true
    }
  });

  // Log activity
  await logDocumentActivity({
    documentId: document.id,
    tenantId: user.tenantId,
    userId: user.id,
    action: 'UPDATED',
    details: data
  });

  return updated;
}

export async function deleteDocument(documentId, user, permanent = false) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      tenantId: user.tenantId
    }
  });

  if (!document) {
    throw new Error('Document not found');
  }

  if (permanent) {
    // Delete physical file
    await deletePhysicalFile(document.storagePath);

    // Delete all versions
    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      select: { storagePath: true }
    });

    for (const version of versions) {
      await deletePhysicalFile(version.storagePath);
    }

    // Delete from database (cascade will handle related records)
    await prisma.document.delete({
      where: { id: documentId }
    });

    return { message: 'Document permanently deleted' };
  } else {
    // Soft delete
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'DELETED',
        updatedBy: user.id
      }
    });

    // Log activity
    await logDocumentActivity({
      documentId: document.id,
      tenantId: user.tenantId,
      userId: user.id,
      action: 'DELETED'
    });

    return { message: 'Document moved to trash' };
  }
}

export async function restoreDocument(documentId, user) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      tenantId: user.tenantId,
      status: 'DELETED'
    }
  });

  if (!document) {
    throw new Error('Document not found in trash');
  }

  const restored = await prisma.document.update({
    where: { id: documentId },
    data: {
      status: 'ACTIVE',
      updatedBy: user.id
    }
  });

  // Log activity
  await logDocumentActivity({
    documentId: document.id,
    tenantId: user.tenantId,
    userId: user.id,
    action: 'RESTORED'
  });

  return restored;
}

// ==================== VERSION CONTROL ====================

export async function createDocumentVersion(documentId, data, user) {
  const { fileName, fileSize, storagePath, changeLog } = data;

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      tenantId: user.tenantId
    },
    include: {
      versions: {
        orderBy: { versionNumber: 'desc' },
        take: 1
      }
    }
  });

  if (!document) {
    throw new Error('Document not found');
  }

  const nextVersion = document.versions[0]?.versionNumber + 1 || 1;
  const checksum = await calculateChecksum(storagePath);

  // Create new version
  const version = await prisma.documentVersion.create({
    data: {
      documentId,
      versionNumber: nextVersion,
      fileName,
      fileSize,
      storagePath,
      checksum,
      changeLog,
      createdBy: user.id
    }
  });

  // Update document to point to new version
  await prisma.document.update({
    where: { id: documentId },
    data: {
      version: nextVersion,
      fileName,
      fileSize,
      storagePath,
      checksum,
      updatedBy: user.id
    }
  });

  // Log activity
  await logDocumentActivity({
    documentId,
    tenantId: user.tenantId,
    userId: user.id,
    action: 'VERSION_CREATED',
    details: { versionNumber: nextVersion, changeLog }
  });

  return version;
}

export async function getDocumentVersions(documentId, user) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      tenantId: user.tenantId
    }
  });

  if (!document) {
    throw new Error('Document not found');
  }

  const versions = await prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { versionNumber: 'desc' }
  });

  return versions;
}

export async function revertToVersion(documentId, versionNumber, user) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      tenantId: user.tenantId
    }
  });

  if (!document) {
    throw new Error('Document not found');
  }

  const version = await prisma.documentVersion.findUnique({
    where: {
      documentId_versionNumber: {
        documentId,
        versionNumber
      }
    }
  });

  if (!version) {
    throw new Error('Version not found');
  }

  // Update document to use this version
  await prisma.document.update({
    where: { id: documentId },
    data: {
      version: versionNumber,
      fileName: version.fileName,
      fileSize: version.fileSize,
      storagePath: version.storagePath,
      checksum: version.checksum,
      updatedBy: user.id
    }
  });

  // Log activity
  await logDocumentActivity({
    documentId,
    tenantId: user.tenantId,
    userId: user.id,
    action: 'VERSION_REVERTED',
    details: { versionNumber }
  });

  return { message: `Reverted to version ${versionNumber}` };
}

// ==================== FOLDER MANAGEMENT ====================

export async function createFolder(data, user) {
  const { name, description, parentId, color, icon } = data;

  let path = `/${name}`;
  if (parentId) {
    const parent = await prisma.documentFolder.findFirst({
      where: {
        id: parentId,
        tenantId: user.tenantId
      }
    });

    if (!parent) {
      throw new Error('Parent folder not found');
    }

    path = `${parent.path}/${name}`;
  }

  const folder = await prisma.documentFolder.create({
    data: {
      tenantId: user.tenantId,
      name,
      description,
      parentId,
      path,
      color,
      icon,
      createdBy: user.id
    },
    include: {
      parent: {
        select: { name: true, path: true }
      },
      _count: {
        select: {
          children: true,
          documents: true
        }
      }
    }
  });

  return folder;
}

export async function listFolders(filters, user) {
  const { parentId, search } = filters;

  const where = {
    tenantId: user.tenantId
  };

  if (parentId !== undefined) {
    where.parentId = parentId;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  const folders = await prisma.documentFolder.findMany({
    where,
    include: {
      parent: {
        select: { id: true, name: true, path: true }
      },
      _count: {
        select: {
          children: true,
          documents: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  return folders;
}

export async function getFolder(folderId, user) {
  const folder = await prisma.documentFolder.findFirst({
    where: {
      id: folderId,
      tenantId: user.tenantId
    },
    include: {
      parent: {
        select: { id: true, name: true, path: true }
      },
      children: {
        include: {
          _count: {
            select: {
              children: true,
              documents: true
            }
          }
        }
      },
      documents: {
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          version: true,
          createdAt: true,
          updatedAt: true
        }
      },
      _count: {
        select: {
          children: true,
          documents: true
        }
      }
    }
  });

  if (!folder) {
    throw new Error('Folder not found');
  }

  return folder;
}

export async function updateFolder(folderId, data, user) {
  const folder = await prisma.documentFolder.findFirst({
    where: {
      id: folderId,
      tenantId: user.tenantId
    }
  });

  if (!folder) {
    throw new Error('Folder not found');
  }

  // If name is being changed, update path
  let updateData = { ...data };
  if (data.name && data.name !== folder.name) {
    const parentPath = folder.path.substring(0, folder.path.lastIndexOf('/'));
    updateData.path = `${parentPath}/${data.name}`;

    // Update paths of all children recursively
    await updateChildrenPaths(folderId, updateData.path);
  }

  const updated = await prisma.documentFolder.update({
    where: { id: folderId },
    data: updateData
  });

  return updated;
}

export async function deleteFolder(folderId, user, permanent = false) {
  const folder = await prisma.documentFolder.findFirst({
    where: {
      id: folderId,
      tenantId: user.tenantId
    },
    include: {
      children: true,
      documents: true
    }
  });

  if (!folder) {
    throw new Error('Folder not found');
  }

  if (folder.children.length > 0) {
    throw new Error('Cannot delete folder with subfolders. Delete subfolders first.');
  }

  if (permanent) {
    // Delete all documents in folder
    for (const doc of folder.documents) {
      await deleteDocument(doc.id, user, true);
    }

    // Delete folder
    await prisma.documentFolder.delete({
      where: { id: folderId }
    });

    return { message: 'Folder permanently deleted' };
  } else {
    // Soft delete all documents
    await prisma.document.updateMany({
      where: { folderId },
      data: { status: 'DELETED' }
    });

    return { message: 'Folder documents moved to trash' };
  }
}

// Helper function to update children paths recursively
async function updateChildrenPaths(parentId, newParentPath) {
  const children = await prisma.documentFolder.findMany({
    where: { parentId }
  });

  for (const child of children) {
    const newPath = `${newParentPath}/${child.name}`;
    await prisma.documentFolder.update({
      where: { id: child.id },
      data: { path: newPath }
    });

    // Recursively update grandchildren
    await updateChildrenPaths(child.id, newPath);
  }
}

// ==================== SHARING ====================

export async function createDocumentShare(documentId, data, user) {
  const {
    shareType,
    sharedWith,
    expiresAt,
    password,
    maxDownloads,
    canView = true,
    canDownload = true,
    canEdit = false,
    canShare = false
  } = data;

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      tenantId: user.tenantId
    }
  });

  if (!document) {
    throw new Error('Document not found');
  }

  const shareData = {
    documentId,
    shareType,
    sharedWith,
    expiresAt,
    password,
    maxDownloads,
    canView,
    canDownload,
    canEdit,
    canShare,
    createdBy: user.id
  };

  if (shareType === 'LINK') {
    shareData.shareToken = crypto.randomBytes(32).toString('hex');
  }

  const share = await prisma.documentShare.create({
    data: shareData
  });

  // Log activity
  await logDocumentActivity({
    documentId,
    tenantId: user.tenantId,
    userId: user.id,
    action: 'SHARED',
    details: { shareType, sharedWith }
  });

  return share;
}

export async function listDocumentShares(documentId, user) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      tenantId: user.tenantId
    }
  });

  if (!document) {
    throw new Error('Document not found');
  }

  const shares = await prisma.documentShare.findMany({
    where: {
      documentId,
      isActive: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return shares;
}

export async function revokeDocumentShare(shareId, user) {
  const share = await prisma.documentShare.findFirst({
    where: { id: shareId },
    include: {
      document: {
        select: { tenantId: true }
      }
    }
  });

  if (!share || share.document.tenantId !== user.tenantId) {
    throw new Error('Share not found');
  }

  await prisma.documentShare.update({
    where: { id: shareId },
    data: { isActive: false }
  });

  return { message: 'Share revoked' };
}

// ==================== PERMISSIONS ====================

export async function setDocumentPermissions(documentId, permissions, user) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      tenantId: user.tenantId
    }
  });

  if (!document) {
    throw new Error('Document not found');
  }

  // Delete existing permissions
  await prisma.documentPermission.deleteMany({
    where: { documentId }
  });

  // Create new permissions
  const created = await prisma.documentPermission.createMany({
    data: permissions.map(p => ({
      documentId,
      ...p
    }))
  });

  return created;
}

export async function setFolderPermissions(folderId, permissions, user) {
  const folder = await prisma.documentFolder.findFirst({
    where: {
      id: folderId,
      tenantId: user.tenantId
    }
  });

  if (!folder) {
    throw new Error('Folder not found');
  }

  // Delete existing permissions
  await prisma.documentFolderPermission.deleteMany({
    where: { folderId }
  });

  // Create new permissions
  const created = await prisma.documentFolderPermission.createMany({
    data: permissions.map(p => ({
      folderId,
      ...p
    }))
  });

  return created;
}

// ==================== TEMPLATES ====================

export async function createDocumentTemplate(data, user) {
  const {
    name,
    description,
    category,
    fileName,
    storagePath,
    fileSize,
    mimeType,
    fields = []
  } = data;

  const template = await prisma.documentTemplate.create({
    data: {
      tenantId: user.tenantId,
      name,
      description,
      category,
      fileName,
      storagePath,
      fileSize,
      mimeType,
      fields,
      createdBy: user.id
    }
  });

  return template;
}

export async function listDocumentTemplates(filters, user) {
  const { category, search, isActive = true } = filters;

  const where = {
    tenantId: user.tenantId,
    isActive
  };

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  const templates = await prisma.documentTemplate.findMany({
    where,
    orderBy: { usageCount: 'desc' }
  });

  return templates;
}

export async function generateFromTemplate(templateId, data, user) {
  const template = await prisma.documentTemplate.findFirst({
    where: {
      id: templateId,
      tenantId: user.tenantId,
      isActive: true
    }
  });

  if (!template) {
    throw new Error('Template not found');
  }

  // Increment usage count
  await prisma.documentTemplate.update({
    where: { id: templateId },
    data: { usageCount: { increment: 1 } }
  });

  // In a real implementation, you would:
  // 1. Copy the template file
  // 2. Replace placeholders with actual data
  // 3. Save as new document

  // For now, return template info and data for frontend to handle
  return {
    template,
    data,
    message: 'Template ready for generation'
  };
}

// ==================== ACTIVITY & AUDIT ====================

export async function getDocumentActivities(documentId, user, limit = 50) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      tenantId: user.tenantId
    }
  });

  if (!document) {
    throw new Error('Document not found');
  }

  const activities = await prisma.documentActivity.findMany({
    where: { documentId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  return activities;
}

async function logDocumentActivity(data) {
  await prisma.documentActivity.create({
    data
  });
}

// ==================== HELPERS ====================

async function calculateChecksum(filePath) {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    console.error('Error calculating checksum:', error);
    return null;
  }
}

async function deletePhysicalFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

// ==================== STATISTICS ====================

export async function getDocumentStatistics(user) {
  const [
    totalDocuments,
    totalSize,
    recentDocuments,
    topTags,
    documentsByType
  ] = await Promise.all([
    // Total documents
    prisma.document.count({
      where: {
        tenantId: user.tenantId,
        status: 'ACTIVE'
      }
    }),

    // Total storage size
    prisma.document.aggregate({
      where: {
        tenantId: user.tenantId,
        status: 'ACTIVE'
      },
      _sum: {
        fileSize: true
      }
    }),

    // Recent documents
    prisma.document.findMany({
      where: {
        tenantId: user.tenantId,
        status: 'ACTIVE'
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        createdAt: true
      }
    }),

    // Top tags
    prisma.$queryRaw`
      SELECT unnest(tags) as tag, COUNT(*) as count
      FROM "Document"
      WHERE "tenantId" = ${user.tenantId} AND status = 'ACTIVE'
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 10
    `,

    // Documents by MIME type
    prisma.document.groupBy({
      by: ['mimeType'],
      where: {
        tenantId: user.tenantId,
        status: 'ACTIVE'
      },
      _count: true,
      _sum: {
        fileSize: true
      }
    })
  ]);

  return {
    totalDocuments,
    totalSize: totalSize._sum.fileSize || 0,
    recentDocuments,
    topTags,
    documentsByType
  };
}
