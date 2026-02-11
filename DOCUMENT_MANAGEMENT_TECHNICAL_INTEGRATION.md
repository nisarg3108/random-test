# Document Management System - Technical Integration Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Deep Dive](#architecture-deep-dive)
3. [Entity Linking Patterns](#entity-linking-patterns)
4. [Database Schema Extensions](#database-schema-extensions)
5. [Storage Architecture](#storage-architecture)
6. [Permission Resolution System](#permission-resolution-system)
7. [Version Control Implementation](#version-control-implementation)
8. [API Integration Patterns](#api-integration-patterns)
9. [Frontend Integration](#frontend-integration)
10. [Security & Compliance](#security--compliance)
11. [Performance & Optimization](#performance--optimization)
12. [Testing & Validation](#testing--validation)

---

## Overview

This guide provides comprehensive technical documentation for integrating the Document Management System with all ERP modules. It covers entity relationships, API patterns, permission models, and real-world implementation examples.

### Current State

**✅ Implemented:**
- Core document CRUD operations
- Folder hierarchy management
- Version control system
- Document sharing with tokens
- Permission management (document & folder level)
- Template system
- Activity logging and audit trail
- Storage abstraction layer (LOCAL/S3/Azure/GCS)

**⚠️ Missing:**
- **Entity linking tables** to connect documents with ERP entities
- **Module-specific document APIs** for seamless integration
- **Automated document workflows** (approval, retention policies)
- **Full-text search** and OCR capabilities
- **Document preview** generation
- **Virus scanning** integration
- **Retention policies** and legal hold
- **Batch operations** for bulk document management

---

## Architecture Deep Dive

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    ERP Modules Layer                         │
│  HR | Finance | Assets | Projects | CRM | Procurement       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              Document Management API Layer                   │
│  - Entity Link Service                                       │
│  - Document CRUD Service                                     │
│  - Permission Service                                        │
│  - Version Control Service                                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                  Storage Provider Layer                      │
│  LOCAL | AWS S3 | Azure Blob | Google Cloud Storage         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow for Entity-Document Linking

```
1. User uploads document from HR/Employee page
   ↓
2. Frontend calls: documentAPI.uploadDocument(file, {entityType, entityId})
   ↓
3. Backend creates Document record
   ↓
4. Backend creates EntityDocument link record
   ↓
5. Backend logs activity
   ↓
6. Return document with entity relationship
```

---

## Entity Linking Patterns

### Why Entity Linking?

Documents need to be associated with specific ERP entities (Employee, Asset, Invoice, etc.) to provide context and enable module-specific queries like "Show me all documents for Employee X" or "Find invoices with attachments".

### Recommended Approach: Polymorphic Association

#### Option 1: Single Join Table (Flexible, Recommended)

Add a new polymorphic junction table:

```prisma
// Add to schema.prisma

model EntityDocument {
  id          String   @id @default(uuid())
  tenantId    String
  documentId  String
  
  // Polymorphic fields
  entityType  String   // "EMPLOYEE" | "ASSET" | "INVOICE" | "PROJECT" | etc.
  entityId    String   // ID of the linked entity
  
  // Relationship metadata
  relationship String? // "CONTRACT" | "ID_PROOF" | "CERTIFICATE" | "ATTACHMENT"
  description  String?
  isPrimary    Boolean @default(false) // Mark primary document for entity
  isRequired   Boolean @default(false)
  
  // Audit
  linkedBy     String
  linkedAt     DateTime @default(now())
  
  document     Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  @@unique([documentId, entityType, entityId])
  @@index([tenantId, entityType, entityId])
  @@index([documentId])
}
```

**Advantages:**
- ✅ Single table for all entity types
- ✅ Easy to query across all linked documents
- ✅ Flexible for new entity types
- ✅ Simple schema maintenance

**Disadvantages:**
- ❌ No foreign key constraints (can't enforce referential integrity)
- ❌ Requires application-level validation

#### Option 2: Entity-Specific Tables (Type-Safe)

Create separate junction tables for each entity type:

```prisma
model EmployeeDocument {
  id          String   @id @default(uuid())
  tenantId    String
  employeeId  String
  documentId  String
  documentType String? // "CONTRACT" | "ID_PROOF" | "RESUME" | "CERTIFICATE"
  linkedBy    String
  linkedAt    DateTime @default(now())
  
  employee    Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  @@unique([employeeId, documentId])
  @@index([tenantId, employeeId])
}

model AssetDocument {
  id          String   @id @default(uuid())
  tenantId    String
  assetId     String
  documentId  String
  documentType String? // "PURCHASE_INVOICE" | "WARRANTY" | "MANUAL" | "MAINTENANCE_RECORD"
  linkedBy    String
  linkedAt    DateTime @default(now())
  
  asset       Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  @@unique([assetId, documentId])
  @@index([tenantId, assetId])
}

model InvoiceDocument {
  id          String   @id @default(uuid())
  tenantId    String
  invoiceId   String
  documentId  String
  documentType String? // "INVOICE_PDF" | "SUPPORTING_DOC" | "RECEIPT"
  linkedBy    String
  linkedAt    DateTime @default(now())
  
  invoice     SalesInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  @@unique([invoiceId, documentId])
  @@index([tenantId, invoiceId])
}

// Repeat for: Project, PurchaseOrder, Customer, Vendor, Contract, etc.
```

**Advantages:**
- ✅ Type-safe with foreign key constraints
- ✅ Database-enforced referential integrity
- ✅ Entity-specific validation possible

**Disadvantages:**
- ❌ Many tables to maintain
- ❌ Repetitive schema code
- ❌ Harder to query across entity types

### Recommendation

Use **Option 1 (EntityDocument)** for flexibility and easier maintenance. Add application-level validation to ensure entity existence.

---

## Database Schema Extensions

### Implementation Steps

#### Step 1: Add EntityDocument Model

```bash
# In backend/prisma/schema.prisma
# Add the EntityDocument model as shown in Option 1 above
```

#### Step 2: Update Document Model

```prisma
model Document {
  // ... existing fields ...
  
  // Add relation to EntityDocument
  entityLinks EntityDocument[]
  
  // Optional: Add backward compatibility fields
  linkedEntityType String? // For quick queries
  linkedEntityId   String? // For quick queries
}
```

#### Step 3: Create Migration

```bash
cd backend
npx prisma migrate dev --name add_entity_document_linking
npx prisma generate
```

### Entity Type Constants

Create a centralized enum file:

```javascript
// backend/src/modules/documents/constants.js

export const ENTITY_TYPES = {
  EMPLOYEE: 'EMPLOYEE',
  ASSET: 'ASSET',
  INVOICE: 'INVOICE',
  SALES_ORDER: 'SALES_ORDER',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  PROJECT: 'PROJECT',
  CUSTOMER: 'CUSTOMER',
  VENDOR: 'VENDOR',
  EXPENSE_CLAIM: 'EXPENSE_CLAIM',
  LEAVE_REQUEST: 'LEAVE_REQUEST',
  ATTENDANCE: 'ATTENDANCE',
  PAYROLL: 'PAYROLL',
  ASSET_MAINTENANCE: 'ASSET_MAINTENANCE',
  CONTRACT: 'CONTRACT',
  LEAD: 'LEAD',
  DEAL: 'DEAL',
  TASK: 'TASK',
  MEETING: 'MEETING',
  TRAINING: 'TRAINING',
};

export const DOCUMENT_RELATIONSHIPS = {
  // Employee
  EMPLOYEE_CONTRACT: 'EMPLOYEE_CONTRACT',
  EMPLOYEE_ID_PROOF: 'EMPLOYEE_ID_PROOF',
  EMPLOYEE_RESUME: 'EMPLOYEE_RESUME',
  EMPLOYEE_CERTIFICATE: 'EMPLOYEE_CERTIFICATE',
  EMPLOYEE_OFFER_LETTER: 'EMPLOYEE_OFFER_LETTER',
  
  // Asset
  ASSET_PURCHASE_INVOICE: 'ASSET_PURCHASE_INVOICE',
  ASSET_WARRANTY: 'ASSET_WARRANTY',
  ASSET_MANUAL: 'ASSET_MANUAL',
  ASSET_MAINTENANCE_RECORD: 'ASSET_MAINTENANCE_RECORD',
  
  // Invoice
  INVOICE_PDF: 'INVOICE_PDF',
  INVOICE_SUPPORTING_DOC: 'INVOICE_SUPPORTING_DOC',
  INVOICE_RECEIPT: 'INVOICE_RECEIPT',
  
  // Project
  PROJECT_PROPOSAL: 'PROJECT_PROPOSAL',
  PROJECT_CONTRACT: 'PROJECT_CONTRACT',
  PROJECT_DELIVERABLE: 'PROJECT_DELIVERABLE',
  PROJECT_REPORT: 'PROJECT_REPORT',
  
  // Generic
  ATTACHMENT: 'ATTACHMENT',
  REFERENCE: 'REFERENCE',
  SUPPORTING_DOCUMENT: 'SUPPORTING_DOCUMENT',
};
```

---

## Storage Architecture

### File Organization Structure

#### Local Storage Layout

```
backend/src/modules/documents/uploads/
├── {tenantId}/
│   ├── documents/
│   │   ├── {year}/
│   │   │   ├── {month}/
│   │   │   │   ├── {documentId}_v{version}_{filename}
│   │   │   │   └── {documentId}_v{version}_{filename}
│   ├── templates/
│   │   └── {templateId}_{filename}
│   └── temp/
│       └── {uploadId}_{filename}
```

**Path Generation Logic:**

```javascript
// backend/src/modules/documents/storage.service.js

import path from 'path';
import { format } from 'date-fns';

export function generateStoragePath(tenantId, documentId, fileName, version = 1) {
  const now = new Date();
  const year = format(now, 'yyyy');
  const month = format(now, 'MM');
  
  const sanitizedFileName = sanitizeFileName(fileName);
  const fileExtension = path.extname(sanitizedFileName);
  const baseName = path.basename(sanitizedFileName, fileExtension);
  
  const finalFileName = `${documentId}_v${version}_${baseName}${fileExtension}`;
  
  return path.join(
    'uploads',
    tenantId,
    'documents',
    year,
    month,
    finalFileName
  );
}

function sanitizeFileName(fileName) {
  // Remove dangerous characters
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255); // Limit length
}
```

### Cloud Storage Integration

#### AWS S3 Configuration

```javascript
// backend/src/modules/documents/storage-providers/s3.provider.js

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

export async function uploadToS3(filePath, fileContent, metadata = {}) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filePath,
    Body: fileContent,
    Metadata: {
      tenantId: metadata.tenantId,
      documentId: metadata.documentId,
      uploadedBy: metadata.uploadedBy,
    },
    ServerSideEncryption: 'AES256', // Enable encryption at rest
  });
  
  await s3Client.send(command);
  return `s3://${BUCKET_NAME}/${filePath}`;
}

export async function getFromS3(filePath) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filePath,
  });
  
  const response = await s3Client.send(command);
  return response.Body;
}

export async function deleteFromS3(filePath) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filePath,
  });
  
  await s3Client.send(command);
}

export async function getPresignedDownloadUrl(filePath, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filePath,
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn });
}
```

#### Azure Blob Storage Configuration

```javascript
// backend/src/modules/documents/storage-providers/azure.provider.js

import { BlobServiceClient } from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_CONTAINER_NAME || 'documents';

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

export async function uploadToAzure(filePath, fileContent, metadata = {}) {
  const blockBlobClient = containerClient.getBlockBlobClient(filePath);
  
  await blockBlobClient.upload(fileContent, fileContent.length, {
    metadata: {
      tenantId: metadata.tenantId,
      documentId: metadata.documentId,
      uploadedBy: metadata.uploadedBy,
    },
  });
  
  return blockBlobClient.url;
}

export async function getFromAzure(filePath) {
  const blockBlobClient = containerClient.getBlockBlobClient(filePath);
  const downloadResponse = await blockBlobClient.download();
  return downloadResponse.readableStreamBody;
}

export async function deleteFromAzure(filePath) {
  const blockBlobClient = containerClient.getBlockBlobClient(filePath);
  await blockBlobClient.delete();
}
```

### Storage Provider Factory

```javascript
// backend/src/modules/documents/storage-providers/factory.js

import * as LocalStorage from './local.provider.js';
import * as S3Storage from './s3.provider.js';
import * as AzureStorage from './azure.provider.js';

const PROVIDER = process.env.DOCUMENT_STORAGE_PROVIDER || 'LOCAL';

export function getStorageProvider() {
  switch (PROVIDER) {
    case 'S3':
      return S3Storage;
    case 'AZURE':
      return AzureStorage;
    case 'LOCAL':
    default:
      return LocalStorage;
  }
}

export async function uploadFile(filePath, fileContent, metadata) {
  const provider = getStorageProvider();
  return await provider.upload(filePath, fileContent, metadata);
}

export async function downloadFile(storagePath) {
  const provider = getStorageProvider();
  return await provider.download(storagePath);
}

export async function deleteFile(storagePath) {
  const provider = getStorageProvider();
  return await provider.delete(storagePath);
}
```

---

## Permission Resolution System

### Permission Hierarchy

```
1. System Admin (bypass all checks) ✓
   ↓
2. Document Owner (creator) - Full access ✓
   ↓
3. Explicit User Permission ✓
   ↓
4. Role-Based Permission ✓
   ↓
5. Folder Permission (inherited) ✓
   ↓
6. Share Link Permission (if accessing via share) ✓
   ↓
7. Default: Deny ✗
```

### Permission Resolution Algorithm

```javascript
// backend/src/modules/documents/permission.service.js

export async function checkDocumentPermission(documentId, userId, requiredPermission, user) {
  // 1. System admin bypass
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return { granted: true, reason: 'ADMIN_BYPASS' };
  }
  
  // 2. Get document
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      permissions: true,
      folder: {
        include: {
          permissions: true
        }
      }
    }
  });
  
  if (!document) {
    return { granted: false, reason: 'DOCUMENT_NOT_FOUND' };
  }
  
  // Tenant check
  if (document.tenantId !== user.tenantId) {
    return { granted: false, reason: 'TENANT_MISMATCH' };
  }
  
  // 3. Document owner check
  if (document.createdBy === userId) {
    return { granted: true, reason: 'OWNER' };
  }
  
  // 4. Check explicit user permission on document
  const userPermission = document.permissions.find(p => p.userId === userId);
  if (userPermission && userPermission[`can${requiredPermission}`]) {
    return { granted: true, reason: 'USER_PERMISSION' };
  }
  
  // 5. Check role-based permission on document
  const userRoles = await getUserRoles(userId);
  for (const role of userRoles) {
    const rolePermission = document.permissions.find(p => p.roleId === role.roleId);
    if (rolePermission && rolePermission[`can${requiredPermission}`]) {
      return { granted: true, reason: 'ROLE_PERMISSION' };
    }
  }
  
  // 6. Check folder permissions (inherited)
  if (document.folder) {
    const folderPermission = await checkFolderPermission(
      document.folderId,
      userId,
      requiredPermission,
      user
    );
    if (folderPermission.granted) {
      return { granted: true, reason: 'FOLDER_INHERITED' };
    }
  }
  
  // 7. Public document check
  if (document.isPublic && requiredPermission === 'View') {
    return { granted: true, reason: 'PUBLIC_DOCUMENT' };
  }
  
  // Default deny
  return { granted: false, reason: 'NO_PERMISSION' };
}

export async function checkFolderPermission(folderId, userId, requiredPermission, user) {
  // Similar logic for folders
  const folder = await prisma.documentFolder.findUnique({
    where: { id: folderId },
    include: { permissions: true, parent: true }
  });
  
  if (!folder) {
    return { granted: false, reason: 'FOLDER_NOT_FOUND' };
  }
  
  // Check user permission
  const userPerm = folder.permissions.find(p => p.userId === userId);
  if (userPerm && userPerm[`can${requiredPermission}`]) {
    return { granted: true, reason: 'FOLDER_USER_PERMISSION' };
  }
  
  // Check role permission
  const userRoles = await getUserRoles(userId);
  for (const role of userRoles) {
    const rolePerm = folder.permissions.find(p => p.roleId === role.roleId);
    if (rolePerm && rolePerm[`can${requiredPermission}`]) {
      return { granted: true, reason: 'FOLDER_ROLE_PERMISSION' };
    }
  }
  
  // Check parent folder (recursive)
  if (folder.parent) {
    return await checkFolderPermission(folder.parentId, userId, requiredPermission, user);
  }
  
  return { granted: false, reason: 'NO_FOLDER_PERMISSION' };
}

async function getUserRoles(userId) {
  return await prisma.userRole.findMany({
    where: { userId },
    include: { role: true }
  });
}
```

### Permission Matrix

| Action | Owner | Can View | Can Edit | Can Delete | Can Share | Can Manage |
|--------|-------|----------|----------|------------|-----------|------------|
| View Details | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Download | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Update Metadata | ✓ | ✗ | ✓ | ✓ | ✗ | ✓ |
| Upload Version | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Delete | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ |
| Create Share | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Manage Permissions | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## Version Control Implementation

### How Versioning Works

1. **Upload New Version:**
   - User uploads new file for existing document
   - System creates `DocumentVersion` record with incremented version number
   - Updates `Document` record with new file info and version number
   - Old file remains in storage (never deleted)

2. **Version Storage:**
   ```
   uploads/{tenantId}/documents/2026/02/
   ├── abc123_v1_contract.pdf    ← Original
   ├── abc123_v2_contract.pdf    ← Revision 1
   └── abc123_v3_contract.pdf    ← Latest
   ```

3. **Revert to Version:**
   - System copies version file metadata to main document
   - Does NOT create new version (preserves history)
   - Updates document's `storagePath` to point to old version file

### Version Service Implementation

```javascript
// backend/src/modules/documents/version.service.js

export async function createNewVersion(documentId, fileData, changeLog, user) {
  const document = await prisma.document.findFirst({
    where: { id: documentId, tenantId: user.tenantId },
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
  
  const nextVersion = (document.versions[0]?.versionNumber || 0) + 1;
  
  // Store new version file
  const storagePath = generateStoragePath(
    user.tenantId,
    documentId,
    fileData.originalname,
    nextVersion
  );
  
  await storeFile(fileData.buffer, storagePath);
  
  const checksum = calculateChecksum(fileData.buffer);
  
  // Create version record
  const version = await prisma.documentVersion.create({
    data: {
      documentId,
      versionNumber: nextVersion,
      fileName: fileData.originalname,
      fileSize: fileData.size,
      storagePath,
      checksum,
      changeLog: changeLog || `Version ${nextVersion}`,
      createdBy: user.id
    }
  });
  
  // Update main document to point to new version
  await prisma.document.update({
    where: { id: documentId },
    data: {
      version: nextVersion,
      fileName: fileData.originalname,
      fileSize: fileData.size,
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

export async function compareVersions(documentId, version1, version2, user) {
  const versions = await prisma.documentVersion.findMany({
    where: {
      documentId,
      versionNumber: { in: [version1, version2] }
    },
    orderBy: { versionNumber: 'asc' }
  });
  
  if (versions.length !== 2) {
    throw new Error('Versions not found');
  }
  
  return {
    version1: versions[0],
    version2: versions[1],
    differences: {
      sizeChange: versions[1].fileSize - versions[0].fileSize,
      sizeChangePercent: ((versions[1].fileSize - versions[0].fileSize) / versions[0].fileSize * 100).toFixed(2),
      nameChanged: versions[0].fileName !== versions[1].fileName,
      checksumChanged: versions[0].checksum !== versions[1].checksum,
      timeBetween: new Date(versions[1].createdAt) - new Date(versions[0].createdAt), // ms
    }
  };
}
```

---

## API Integration Patterns

### Entity Document Linking Service

```javascript
// backend/src/modules/documents/entity-link.service.js

import prisma from '../../config/db.js';
import { ENTITY_TYPES } from './constants.js';

export async function linkDocumentToEntity(documentId, entityType, entityId, options, user) {
  const { relationship, description, isPrimary, isRequired } = options;
  
  // Validate entity exists
  await validateEntity(entityType, entityId, user.tenantId);
  
  // Check if already linked
  const existing = await prisma.entityDocument.findUnique({
    where: {
      documentId_entityType_entityId: {
        documentId,
        entityType,
        entityId
      }
    }
  });
  
  if (existing) {
    throw new Error('Document already linked to this entity');
  }
  
  // If marking as primary, unmark others
  if (isPrimary) {
    await prisma.entityDocument.updateMany({
      where: {
        tenantId: user.tenantId,
        entityType,
        entityId,
        relationship,
        isPrimary: true
      },
      data: { isPrimary: false }
    });
  }
  
  const link = await prisma.entityDocument.create({
    data: {
      tenantId: user.tenantId,
      documentId,
      entityType,
      entityId,
      relationship,
      description,
      isPrimary,
      isRequired,
      linkedBy: user.id
    },
    include: {
      document: {
        select: {
          id: true,
          name: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          version: true,
          createdAt: true
        }
      }
    }
  });
  
  // Log activity
  await logDocumentActivity({
    documentId,
    tenantId: user.tenantId,
    userId: user.id,
    action: 'LINKED_TO_ENTITY',
    details: { entityType, entityId, relationship }
  });
  
  return link;
}

export async function getEntityDocuments(entityType, entityId, filters, user) {
  const { relationship, includeInherited = false } = filters;
  
  const where = {
    tenantId: user.tenantId,
    entityType,
    entityId
  };
  
  if (relationship) {
    where.relationship = relationship;
  }
  
  const links = await prisma.entityDocument.findMany({
    where,
    include: {
      document: {
        include: {
          folder: { select: { name: true, path: true } },
          _count: { select: { versions: true } }
        }
      }
    },
    orderBy: [
      { isPrimary: 'desc' },
      { linkedAt: 'desc' }
    ]
  });
  
  return links;
}

export async function unlinkDocumentFromEntity(documentId, entityType, entityId, user) {
  const link = await prisma.entityDocument.findFirst({
    where: {
      documentId,
      entityType,
      entityId,
      tenantId: user.tenantId
    }
  });
  
  if (!link) {
    throw new Error('Link not found');
  }
  
  await prisma.entityDocument.delete({
    where: { id: link.id }
  });
  
  // Log activity
  await logDocumentActivity({
    documentId,
    tenantId: user.tenantId,
    userId: user.id,
    action: 'UNLINKED_FROM_ENTITY',
    details: { entityType, entityId }
  });
  
  return { message: 'Document unlinked successfully' };
}

async function validateEntity(entityType, entityId, tenantId) {
  const modelMap = {
    [ENTITY_TYPES.EMPLOYEE]: 'employee',
    [ENTITY_TYPES.ASSET]: 'asset',
    [ENTITY_TYPES.INVOICE]: 'salesInvoice',
    [ENTITY_TYPES.PROJECT]: 'project',
    // Add all entity types
  };
  
  const model = modelMap[entityType];
  if (!model) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }
  
  const entity = await prisma[model].findFirst({
    where: { id: entityId, tenantId }
  });
  
  if (!entity) {
    throw new Error(`${entityType} not found`);
  }
  
  return entity;
}
```

### Module-Specific Integration Examples

#### HR Module - Employee Documents

```javascript
// backend/src/modules/hr/employee-document.service.js

import { linkDocumentToEntity, getEntityDocuments } from '../documents/entity-link.service.js';
import { ENTITY_TYPES, DOCUMENT_RELATIONSHIPS } from '../documents/constants.js';

export async function attachEmployeeDocument(employeeId, documentId, documentType, user) {
  return await linkDocumentToEntity(
    documentId,
    ENTITY_TYPES.EMPLOYEE,
    employeeId,
    {
      relationship: documentType, // CONTRACT, ID_PROOF, etc.
      isPrimary: documentType === DOCUMENT_RELATIONSHIPS.EMPLOYEE_CONTRACT
    },
    user
  );
}

export async function getEmployeeDocuments(employeeId, user) {
  return await getEntityDocuments(
    ENTITY_TYPES.EMPLOYEE,
    employeeId,
    {},
    user
  );
}

export async function getEmployeeContract(employeeId, user) {
  const docs = await getEntityDocuments(
    ENTITY_TYPES.EMPLOYEE,
    employeeId,
    { relationship: DOCUMENT_RELATIONSHIPS.EMPLOYEE_CONTRACT },
    user
  );
  
  return docs.find(d => d.isPrimary) || docs[0] || null;
}
```

#### Asset Module - Asset Documents

```javascript
// backend/src/modules/assets/asset-document.service.js

import { linkDocumentToEntity, getEntityDocuments } from '../documents/entity-link.service.js';
import { ENTITY_TYPES, DOCUMENT_RELATIONSHIPS } from '../documents/constants.js';

export async function attachAssetDocument(assetId, documentId, documentType, user) {
  return await linkDocumentToEntity(
    documentId,
    ENTITY_TYPES.ASSET,
    assetId,
    { relationship: documentType },
    user
  );
}

export async function getAssetDocuments(assetId, user) {
  return await getEntityDocuments(
    ENTITY_TYPES.ASSET,
    assetId,
    {},
    user
  );
}

export async function getAssetPurchaseInvoice(assetId, user) {
  const docs = await getEntityDocuments(
    ENTITY_TYPES.ASSET,
    assetId,
    { relationship: DOCUMENT_RELATIONSHIPS.ASSET_PURCHASE_INVOICE },
    user
  );
  
  return docs[0] || null;
}
```

#### Finance Module - Invoice Documents

```javascript
// backend/src/modules/finance/invoice-document.service.js

import { linkDocumentToEntity, getEntityDocuments } from '../documents/entity-link.service.js';
import { ENTITY_TYPES, DOCUMENT_RELATIONSHIPS } from '../documents/constants.js';

export async function attachInvoiceDocument(invoiceId, documentId, documentType, user) {
  return await linkDocumentToEntity(
    documentId,
    ENTITY_TYPES.INVOICE,
    invoiceId,
    { relationship: documentType },
    user
  );
}

export async function getInvoiceDocuments(invoiceId, user) {
  return await getEntityDocuments(
    ENTITY_TYPES.INVOICE,
    invoiceId,
    {},
    user
  );
}

// Auto-generate invoice PDF and attach
export async function generateAndAttachInvoicePDF(invoiceId, user) {
  const pdfBuffer = await generateInvoicePDF(invoiceId, user);
  
  // Upload as document
  const document = await uploadDocument({
    file: pdfBuffer,
    name: `Invoice_${invoiceId}.pdf`,
    folderId: await getInvoicesFolderId(user.tenantId)
  }, user);
  
  // Link to invoice
  await attachInvoiceDocument(
    invoiceId,
    document.id,
    DOCUMENT_RELATIONSHIPS.INVOICE_PDF,
    user
  );
  
  return document;
}
```

---

## Frontend Integration

### React Hook for Entity Documents

```javascript
// frontend/src/hooks/useEntityDocuments.js

import { useState, useEffect } from 'react';
import { entityDocumentAPI } from '../api/documents';

export function useEntityDocuments(entityType, entityId) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!entityType || !entityId) return;
    
    loadDocuments();
  }, [entityType, entityId]);
  
  const loadDocuments = async () => {
    try {
      setLoading(true);
      const result = await entityDocumentAPI.getEntityDocuments(entityType, entityId);
      setDocuments(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const attachDocument = async (documentId, relationship, description) => {
    try {
      const link = await entityDocumentAPI.linkDocument(
        documentId,
        entityType,
        entityId,
        { relationship, description }
      );
      await loadDocuments();
      return link;
    } catch (err) {
      throw err;
    }
  };
  
  const uploadAndAttach = async (file, metadata) => {
    try {
      // Upload document
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', metadata.name || file.name);
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));
      
      const document = await documentAPI.uploadDocument(formData);
      
      // Link to entity
      await attachDocument(document.id, metadata.relationship, metadata.description);
      
      return document;
    } catch (err) {
      throw err;
    }
  };
  
  const detachDocument = async (documentId) => {
    try {
      await entityDocumentAPI.unlinkDocument(documentId, entityType, entityId);
      await loadDocuments();
    } catch (err) {
      throw err;
    }
  };
  
  return {
    documents,
    loading,
    error,
    refresh: loadDocuments,
    attachDocument,
    uploadAndAttach,
    detachDocument
  };
}
```

### Reusable Entity Documents Component

```jsx
// frontend/src/components/documents/EntityDocumentsPanel.jsx

import React, { useState } from 'react';
import {
  Box, Typography, Button, List, ListItem, ListItemIcon,
  ListItemText, ListItemSecondaryAction, IconButton, Chip,
  Dialog, CircularProgress
} from '@mui/material';
import {
  Description as FileIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useEntityDocuments } from '../../hooks/useEntityDocuments';
import { formatBytes, formatDate } from '../../utils/format';
import UploadDialog from './UploadDialog';
import DocumentDetailsDialog from './DocumentDetailsDialog';

export default function EntityDocumentsPanel({ entityType, entityId, title = 'Documents' }) {
  const { documents, loading, uploadAndAttach, detachDocument, refresh } = useEntityDocuments(entityType, entityId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  const handleUpload = async (file, metadata) => {
    try {
      await uploadAndAttach(file, {
        ...metadata,
        relationship: metadata.relationship || 'ATTACHMENT'
      });
      setUploadOpen(false);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
  
  const handleDetach = async (documentId) => {
    if (!confirm('Remove this document from the entity?')) return;
    
    try {
      await detachDocument(documentId);
    } catch (error) {
      console.error('Detach failed:', error);
    }
  };
  
  if (loading) {
    return <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>;
  }
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">{title}</Typography>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setUploadOpen(true)}
        >
          Upload
        </Button>
      </Box>
      
      {documents.length === 0 ? (
        <Typography color="textSecondary">No documents attached</Typography>
      ) : (
        <List>
          {documents.map((link) => (
            <ListItem key={link.id} divider>
              <ListItemIcon>
                <FileIcon />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    {link.document.name}
                    {link.isPrimary && <Chip label="Primary" size="small" color="primary" />}
                  </Box>
                }
                secondary={
                  <>
                    {link.relationship && <Chip label={link.relationship} size="small" sx={{ mr: 1 }} />}
                    {formatBytes(link.document.fileSize)} • 
                    v{link.document.version} • 
                    {formatDate(link.document.createdAt)}
                  </>
                }
              />
              <ListItemSecondaryAction>
                <IconButton onClick={() => setSelectedDoc(link.document)}>
                  <ViewIcon />
                </IconButton>
                <IconButton onClick={() => handleDetach(link.document.id)} color="error">
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
      
      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
        entityType={entityType}
        entityId={entityId}
      />
      
      {selectedDoc && (
        <DocumentDetailsDialog
          open={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          document={selectedDoc}
          onUpdate={refresh}
        />
      )}
    </Box>
  );
}
```

### Integration in Module Pages

#### Employee Details Page

```jsx
// frontend/src/pages/HR/EmployeeDetailsPage.jsx

import EntityDocumentsPanel from '../../components/documents/EntityDocumentsPanel';

function EmployeeDetailsPage({ employeeId }) {
  return (
    <Box>
      {/* Other employee details */}
      
      <Box mt={4}>
        <EntityDocumentsPanel
          entityType="EMPLOYEE"
          entityId={employeeId}
          title="Employee Documents"
        />
      </Box>
    </Box>
  );
}
```

#### Asset Details Page

```jsx
// frontend/src/pages/Assets/AssetDetailsPage.jsx

import EntityDocumentsPanel from '../../components/documents/EntityDocumentsPanel';

function AssetDetailsPage({ assetId }) {
  return (
    <Box>
      {/* Other asset details */}
      
      <Tabs value={tabValue} onChange={handleTabChange}>
        <Tab label="Details" />
        <Tab label="Maintenance" />
        <Tab label="Documents" />
      </Tabs>
      
      <TabPanel value={tabValue} index={2}>
        <EntityDocumentsPanel
          entityType="ASSET"
          entityId={assetId}
          title="Asset Documents"
        />
      </TabPanel>
    </Box>
  );
}
```

---

## Security & Compliance

### File Type Validation

```javascript
// backend/src/modules/documents/validators.js

const ALLOWED_MIME_TYPES = {
  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  
  // Archives
  'application/zip': ['.zip'],
  'application/x-rar-compressed': ['.rar'],
  
  // Text
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
};

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 104857600; // 100MB

export function validateFile(file) {
  const errors = [];
  
  // Size check
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum allowed size of ${formatBytes(MAX_FILE_SIZE)}`);
  }
  
  // MIME type check
  if (!ALLOWED_MIME_TYPES[file.mimetype]) {
    errors.push(`File type ${file.mimetype} is not allowed`);
  }
  
  // Extension check
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ALLOWED_MIME_TYPES[file.mimetype] || [];
  if (!allowedExts.includes(ext)) {
    errors.push(`File extension ${ext} does not match MIME type ${file.mimetype}`);
  }
  
  // Filename sanitization
  if (!/^[a-zA-Z0-9._\-\s()]+$/.test(file.originalname)) {
    errors.push('Filename contains invalid characters');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Virus Scanning Integration

```javascript
// backend/src/modules/documents/virus-scanner.service.js

import ClamScan from 'clamscan';

const clamscan = new ClamScan().init({
  clamdscan: {
    host: process.env.CLAMAV_HOST || 'localhost',
    port: process.env.CLAMAV_PORT || 3310,
  }
});

export async function scanFile(filePath) {
  try {
    const scanner = await clamscan;
    const { isInfected, viruses } = await scanner.scanFile(filePath);
    
    if (isInfected) {
      return {
        safe: false,
        threats: viruses
      };
    }
    
    return { safe: true };
  } catch (error) {
    console.error('Virus scan error:', error);
    // Fail-safe: reject on scan error
    return {
      safe: false,
      error: 'Virus scan failed'
    };
  }
}
```

### Audit Trail & Compliance

```javascript
// backend/src/modules/documents/audit.service.js

export async function logDocumentActivity(data) {
  const {
    documentId,
    shareId,
    tenantId,
    userId,
    action,
    details,
    ipAddress,
    userAgent
  } = data;
  
  return await prisma.documentActivity.create({
    data: {
      documentId,
      shareId,
      tenantId,
      userId,
      action,
      details,
      ipAddress,
      userAgent
    }
  });
}

export async function getAuditTrail(documentId, filters = {}) {
  const { startDate, endDate, actions, userId } = filters;
  
  const where = { documentId };
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }
  
  if (actions && actions.length > 0) {
    where.action = { in: actions };
  }
  
  if (userId) {
    where.userId = userId;
  }
  
  return await prisma.documentActivity.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      document: { select: { name: true } },
      share: { select: { shareType: true } }
    }
  });
}

export async function generateComplianceReport(tenantId, startDate, endDate) {
  const activities = await prisma.documentActivity.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    include: {
      document: { select: { name: true, tags: true } }
    }
  });
  
  return {
    period: { startDate, endDate },
    totalActivities: activities.length,
    byAction: groupBy(activities, 'action'),
    sensitiveDocs: activities.filter(a => 
      a.document?.tags?.includes('confidential') || 
      a.document?.tags?.includes('sensitive')
    ),
    externalShares: activities.filter(a => a.action === 'SHARED'),
    deletions: activities.filter(a => a.action === 'DELETED'),
  };
}
```

---

## Performance & Optimization

### Caching Strategy

```javascript
// backend/src/modules/documents/cache.service.js

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const CACHE_TTL = 300; // 5 minutes

export async function getCachedDocumentList(tenantId, cacheKey) {
  const cached = await redis.get(`docs:${tenantId}:${cacheKey}`);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedDocumentList(tenantId, cacheKey, data) {
  await redis.setex(
    `docs:${tenantId}:${cacheKey}`,
    CACHE_TTL,
    JSON.stringify(data)
  );
}

export async function invalidateDocumentCache(tenantId, documentId) {
  // Clear all list caches for tenant
  const keys = await redis.keys(`docs:${tenantId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  
  // Clear specific document cache
  await redis.del(`doc:${documentId}`);
}
```

### Database Indexing

```sql
-- Critical indexes for document queries

-- Document queries by tenant and folder
CREATE INDEX idx_document_tenant_folder ON "Document" (tenant_id, folder_id);

-- Document queries by status
CREATE INDEX idx_document_tenant_status ON "Document" (tenant_id, status);

-- Template queries
CREATE INDEX idx_document_tenant_template ON "Document" (tenant_id, is_template);

-- Entity document links
CREATE INDEX idx_entity_doc_tenant_entity ON "EntityDocument" (tenant_id, entity_type, entity_id);
CREATE INDEX idx_entity_doc_document ON "EntityDocument" (document_id);

-- Activity logs (time-series)
CREATE INDEX idx_activity_tenant_created ON "DocumentActivity" (tenant_id, created_at DESC);
CREATE INDEX idx_activity_document_created ON "DocumentActivity" (document_id, created_at DESC);

-- Full-text search (PostgreSQL)
CREATE INDEX idx_document_search ON "Document" USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
```

### Bulk Operations

```javascript
// backend/src/modules/documents/bulk.service.js

export async function bulkLinkDocuments(documentIds, entityType, entityId, options, user) {
  const links = documentIds.map(docId => ({
    tenantId: user.tenantId,
    documentId: docId,
    entityType,
    entityId,
    relationship: options.relationship,
    linkedBy: user.id
  }));
  
  return await prisma.entityDocument.createMany({
    data: links,
    skipDuplicates: true
  });
}

export async function bulkUpdateDocumentTags(documentIds, tagsToAdd, tagsToRemove, user) {
  const documents = await prisma.document.findMany({
    where: {
      id: { in: documentIds },
      tenantId: user.tenantId
    },
    select: { id: true, tags: true }
  });
  
  const updates = documents.map(doc => {
    let newTags = [...doc.tags];
    
    if (tagsToAdd) {
      newTags = [...new Set([...newTags, ...tagsToAdd])];
    }
    
    if (tagsToRemove) {
      newTags = newTags.filter(t => !tagsToRemove.includes(t));
    }
    
    return prisma.document.update({
      where: { id: doc.id },
      data: { tags: newTags, updatedBy: user.id }
    });
  });
  
  return await prisma.$transaction(updates);
}
```

---

## Testing & Validation

### Integration Test Examples

```javascript
// backend/tests/integration/document-entity-linking.test.js

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/db.js';

describe('Document Entity Linking', () => {
  let authToken;
  let testEmployee;
  let testDocument;
  
  beforeAll(async () => {
    // Login and get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    authToken = loginRes.body.token;
    
    // Create test employee
    testEmployee = await prisma.employee.create({
      data: {
        tenantId: 'test-tenant',
        userId: 'test-user',
        employeeCode: 'EMP001',
        name: 'Test Employee',
        email: 'employee@test.com',
        designation: 'Developer',
        departmentId: 'test-dept',
        joiningDate: new Date(),
        status: 'ACTIVE'
      }
    });
  });
  
  afterAll(async () => {
    // Cleanup
    await prisma.entityDocument.deleteMany({ where: { entityId: testEmployee.id } });
    await prisma.employee.delete({ where: { id: testEmployee.id } });
  });
  
  it('should upload and link document to employee', async () => {
    // Upload document
    const uploadRes = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', 'tests/fixtures/sample.pdf')
      .field('name', 'Employee Contract');
    
    expect(uploadRes.status).toBe(200);
    testDocument = uploadRes.body;
    
    // Link to employee
    const linkRes = await request(app)
      .post(`/api/documents/${testDocument.id}/link`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        entityType: 'EMPLOYEE',
        entityId: testEmployee.id,
        relationship: 'EMPLOYEE_CONTRACT',
        isPrimary: true
      });
    
    expect(linkRes.status).toBe(200);
    expect(linkRes.body.entityType).toBe('EMPLOYEE');
    expect(linkRes.body.isPrimary).toBe(true);
  });
  
  it('should retrieve employee documents', async () => {
    const res = await request(app)
      .get(`/api/entities/EMPLOYEE/${testEmployee.id}/documents`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].document.name).toBe('Employee Contract');
  });
  
  it('should enforce permission on linked documents', async () => {
    // Try to access document without permission
    const res = await request(app)
      .get(`/api/documents/${testDocument.id}`)
      .set('Authorization', 'Bearer invalid-token');
    
    expect(res.status).toBe(401);
  });
});
```

---

## 📚 Additional Resources

### Migration Guide

If you're upgrading from a system without entity linking:

1. Add `EntityDocument` model to schema
2. Run migration
3. Optionally populate existing links (if stored elsewhere)
4. Deploy entity-link service
5. Update frontend components
6. Test thoroughly

### API Endpoints Summary

#### Entity Document Endpoints (to be implemented)

```
POST   /api/documents/:id/link            - Link document to entity
DELETE /api/documents/:id/link            - Unlink document from entity
GET    /api/entities/:type/:id/documents  - Get all documents for entity
POST   /api/entities/:type/:id/upload     - Upload and link document
```

### Contact & Support

For technical questions or implementation support, refer to:
- Main documentation: [DOCUMENT_MANAGEMENT_IMPLEMENTATION.md](./DOCUMENT_MANAGEMENT_IMPLEMENTATION.md)
- Quick start: [DOCUMENT_MANAGEMENT_QUICK_START.md](./DOCUMENT_MANAGEMENT_QUICK_START.md)
- Business guide: [DOCUMENT_MANAGEMENT_FUNCTIONAL_GUIDE.md](./DOCUMENT_MANAGEMENT_FUNCTIONAL_GUIDE.md)

---

**Document Version:** 1.0.0  
**Last Updated:** February 11, 2026  
**Author:** ERP Development Team
