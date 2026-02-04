# Document Management System Implementation Guide

## Overview

The Document Management System provides comprehensive file storage, organization, version control, sharing, and access management capabilities for your ERP system. This implementation includes both backend APIs and frontend React components.

## Features Implemented

### 1. **File Storage & Organization**
- ✅ Hierarchical folder structure with unlimited nesting
- ✅ Document metadata (name, description, tags)
- ✅ File upload with progress tracking (up to 100MB)
- ✅ Multiple file type support
- ✅ Folder color coding for visual organization
- ✅ Breadcrumb navigation
- ✅ Search and filter capabilities

### 2. **Version Control**
- ✅ Automatic versioning on file updates
- ✅ Version history with change logs
- ✅ Version comparison metadata
- ✅ Revert to previous versions
- ✅ Download specific versions
- ✅ Checksum validation for integrity

### 3. **Document Sharing**
- ✅ Link-based sharing with tokens
- ✅ Email/user-based sharing
- ✅ Expiration dates for shared links
- ✅ Password protection support
- ✅ Download limits
- ✅ Granular permissions (view, download, edit, share)
- ✅ Share revocation

### 4. **Access Permissions**
- ✅ Document-level permissions
- ✅ Folder-level permissions
- ✅ User and role-based access control
- ✅ Permission inheritance
- ✅ Permission management UI

### 5. **Document Templates**
- ✅ Template creation and management
- ✅ Category-based organization
- ✅ Template fields definition
- ✅ Generate documents from templates
- ✅ Usage tracking

### 6. **Additional Features**
- ✅ Activity logging and audit trail
- ✅ Document statistics (views, downloads)
- ✅ Soft delete with trash management
- ✅ Document comments (schema ready)
- ✅ Storage provider abstraction (LOCAL/S3/AZURE/GCS)

## Installation & Setup

### 1. Install Dependencies

The document management system uses `multer` for file uploads. Add it to your backend:

```bash
cd backend
npm install multer
```

### 2. Database Migration

Run the Prisma migration to create the document management tables:

```bash
cd backend
npx prisma migrate dev --name add_document_management
```

### 3. Create Upload Directory

The system stores files locally by default. The upload directory will be created automatically at:
```
backend/src/modules/documents/uploads/{tenantId}/
```

### 4. Environment Variables

Add to your `.env` file:

```env
# Document Storage
DOCUMENT_STORAGE_PROVIDER=LOCAL  # LOCAL | S3 | AZURE | GCS
MAX_FILE_SIZE=104857600  # 100MB in bytes

# For cloud storage (optional)
# AWS_ACCESS_KEY_ID=your_key
# AWS_SECRET_ACCESS_KEY=your_secret
# AWS_S3_BUCKET=your_bucket
# AWS_REGION=us-east-1
```

### 5. Update Frontend Routes

Add the document management route to your React Router configuration:

```javascript
// In your App.jsx or routes file
import DocumentsPage from './pages/Documents/DocumentsPage';

// Add to your routes
{
  path: '/documents',
  element: <DocumentsPage />
}
```

## API Endpoints

### Document Management

#### Upload Document
```http
POST /api/documents/upload
Content-Type: multipart/form-data

FormData:
- file: File
- name: string
- description: string (optional)
- folderId: string (optional)
- tags: JSON array
- metadata: JSON object (optional)
```

#### List Documents
```http
GET /api/documents?folderId={id}&status=ACTIVE&search={query}&page=1&limit=50
```

#### Get Document Details
```http
GET /api/documents/:id
```

#### Update Document
```http
PUT /api/documents/:id
Body: { name, description, tags, metadata }
```

#### Delete Document
```http
DELETE /api/documents/:id?permanent=false
```

#### Restore Document
```http
POST /api/documents/:id/restore
```

#### Download Document
```http
GET /api/documents/:id/download
```

#### Get Statistics
```http
GET /api/documents/statistics
```

### Version Control

#### Create New Version
```http
POST /api/documents/:id/versions
Content-Type: multipart/form-data

FormData:
- file: File
- changeLog: string (optional)
```

#### Get Version History
```http
GET /api/documents/:id/versions
```

#### Revert to Version
```http
POST /api/documents/:id/versions/:versionNumber/revert
```

#### Download Specific Version
```http
GET /api/documents/:id/versions/:versionNumber/download
```

### Folder Management

#### Create Folder
```http
POST /api/documents/folders
Body: { name, description, parentId, color, icon }
```

#### List Folders
```http
GET /api/documents/folders?parentId={id}&search={query}
```

#### Get Folder Details
```http
GET /api/documents/folders/:id
```

#### Update Folder
```http
PUT /api/documents/folders/:id
Body: { name, description, color }
```

#### Delete Folder
```http
DELETE /api/documents/folders/:id?permanent=false
```

### Sharing

#### Create Share
```http
POST /api/documents/:id/shares
Body: {
  shareType: "LINK" | "EMAIL" | "USER",
  sharedWith: string (optional),
  expiresAt: datetime (optional),
  password: string (optional),
  maxDownloads: number (optional),
  canView: boolean,
  canDownload: boolean,
  canEdit: boolean,
  canShare: boolean
}
```

#### List Shares
```http
GET /api/documents/:id/shares
```

#### Revoke Share
```http
DELETE /api/documents/shares/:shareId
```

### Permissions

#### Set Document Permissions
```http
POST /api/documents/:id/permissions
Body: {
  permissions: [
    {
      userId: string,
      canView: boolean,
      canEdit: boolean,
      canDelete: boolean,
      canShare: boolean,
      canManage: boolean
    }
  ]
}
```

#### Set Folder Permissions
```http
POST /api/documents/folders/:id/permissions
Body: { permissions: [...] }
```

### Templates

#### Create Template
```http
POST /api/documents/templates
Content-Type: multipart/form-data

FormData:
- file: File
- name: string
- description: string
- category: string
- fields: JSON array
```

#### List Templates
```http
GET /api/documents/templates?category={cat}&search={query}
```

#### Generate from Template
```http
POST /api/documents/templates/:id/generate
Body: { data: {...} }
```

### Activity Log

#### Get Document Activities
```http
GET /api/documents/:id/activities?limit=50
```

## Database Schema

### Core Models

#### Document
- Stores document metadata and references
- Links to folders, templates, versions
- Tracks views, downloads, status
- Supports tags and custom metadata

#### DocumentFolder
- Hierarchical folder structure
- Path-based navigation
- Color and icon customization
- Permission inheritance

#### DocumentVersion
- Complete version history
- Stores each version separately
- Change log tracking
- Checksum validation

#### DocumentTemplate
- Reusable document templates
- Field definitions for data binding
- Category organization
- Usage statistics

#### DocumentShare
- Link and user-based sharing
- Expiration and password protection
- Granular permissions
- Download tracking

#### DocumentPermission
- User and role-based access
- Document and folder level
- Fine-grained control (view, edit, delete, share, manage)

#### DocumentActivity
- Complete audit trail
- Action tracking (created, viewed, downloaded, shared, deleted)
- User and IP tracking

#### DocumentComment
- Threaded comments
- User attribution
- Edit history

## Frontend Components

### Main Components

#### DocumentsPage
- Primary document browser interface
- Folder navigation with breadcrumbs
- Document grid/list view
- Search and filter functionality
- Context menus for actions

#### UploadDialog
- File upload with drag-and-drop support
- Progress tracking
- Metadata input (name, description, tags)
- Folder selection

#### FolderDialog
- Create and edit folders
- Name, description, color selection
- Parent folder selection

#### DocumentDetailsDialog
- Tabbed interface for document details
- Version history and management
- Activity timeline
- Share management
- Download and delete actions

### API Integration

All frontend components use the centralized API service:

```javascript
import { documentAPI, folderAPI, shareAPI, templateAPI } from '../../api/documents';
```

## Usage Examples

### Backend Service Usage

```javascript
import * as documentService from './modules/documents/document.service.js';

// Create a document
const document = await documentService.createDocument({
  folderId: 'folder-id',
  name: 'Project Proposal',
  description: 'Q1 2026 Proposal',
  fileName: 'proposal.pdf',
  fileSize: 1024000,
  mimeType: 'application/pdf',
  storagePath: '/uploads/tenant/file.pdf',
  tags: ['proposal', 'q1', '2026']
}, user);

// Create a version
const version = await documentService.createDocumentVersion(
  documentId,
  {
    fileName: 'proposal-v2.pdf',
    fileSize: 1048000,
    storagePath: '/uploads/tenant/file-v2.pdf',
    changeLog: 'Updated budget section'
  },
  user
);

// Share a document
const share = await documentService.createDocumentShare(
  documentId,
  {
    shareType: 'LINK',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    canView: true,
    canDownload: true
  },
  user
);
```

### Frontend Usage

```javascript
import { documentAPI } from '../../api/documents';

// Upload a document
const formData = new FormData();
formData.append('file', file);
formData.append('name', 'My Document');
formData.append('tags', JSON.stringify(['important', 'client']));

await documentAPI.uploadDocument(formData, (progress) => {
  console.log(`Upload progress: ${progress.loaded / progress.total * 100}%`);
});

// List documents in a folder
const { data } = await documentAPI.listDocuments({
  folderId: 'folder-id',
  status: 'ACTIVE',
  search: 'proposal',
  page: 1,
  limit: 50
});

// Download a document
const response = await documentAPI.downloadDocument(documentId);
const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');
link.href = url;
link.setAttribute('download', fileName);
document.body.appendChild(link);
link.click();
```

## Security Considerations

1. **File Upload Validation**
   - Maximum file size: 100MB (configurable)
   - File type validation in controller
   - Virus scanning integration point available

2. **Access Control**
   - All routes protected with authentication middleware
   - Tenant isolation enforced at database level
   - Permission checks before file access

3. **Storage Security**
   - Files stored outside public directory
   - Download through authenticated endpoint only
   - Checksum validation for integrity

4. **Sharing Security**
   - Random token generation for links
   - Optional password protection
   - Expiration dates enforced
   - Revocable shares

## Cloud Storage Integration

The system supports multiple storage providers. To switch from LOCAL to cloud storage:

### AWS S3 Example

```javascript
// Install AWS SDK
npm install @aws-sdk/client-s3

// Update document.service.js
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function uploadToS3(file, key) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  });
  
  await s3Client.send(command);
  return `s3://${process.env.AWS_S3_BUCKET}/${key}`;
}
```

## Performance Optimization

1. **Database Indexes**
   - Already configured on tenantId, folderId, status
   - Consider adding composite indexes for common queries

2. **File Storage**
   - Use CDN for frequently accessed files
   - Implement caching headers
   - Consider thumbnail generation for images

3. **Pagination**
   - Default limit of 50 documents per page
   - Adjust based on performance needs

4. **Query Optimization**
   - Use `select` to limit returned fields
   - Include only necessary relations
   - Implement cursor-based pagination for large datasets

## Future Enhancements

1. **Document Preview**
   - PDF preview in browser
   - Image thumbnails
   - Office document preview

2. **OCR Integration**
   - Text extraction from images and PDFs
   - Full-text search

3. **Workflow Integration**
   - Document approval workflows
   - Automated routing

4. **Advanced Search**
   - Full-text search
   - Metadata search
   - Date range filters

5. **Collaboration**
   - Real-time co-editing
   - Comments and annotations
   - @mentions

6. **Analytics**
   - Usage reports
   - Popular documents
   - User activity insights

## Troubleshooting

### File Upload Fails

1. Check file size limits in multer configuration
2. Verify upload directory permissions
3. Check disk space
4. Ensure proper Content-Type header

### Download Issues

1. Verify file exists at storagePath
2. Check user permissions
3. Ensure proper MIME type
4. Check for CORS issues in browser

### Permission Denied

1. Verify user authentication
2. Check tenant isolation
3. Verify document/folder permissions
4. Check role permissions

## Support

For issues or questions:
- Check the implementation in `backend/src/modules/documents/`
- Review API endpoints in `document.routes.js`
- Examine frontend components in `frontend/src/pages/Documents/`
- Check database schema in `backend/prisma/schema.prisma`

## Conclusion

The Document Management System provides enterprise-grade file management capabilities with version control, sharing, and access management. The modular design allows for easy customization and integration with other ERP modules.
