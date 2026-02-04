# Document Management Module

## Quick Links
- 📖 [Full Implementation Guide](../../DOCUMENT_MANAGEMENT_IMPLEMENTATION.md)
- 🚀 [Quick Start Guide](../../DOCUMENT_MANAGEMENT_QUICK_START.md)
- ✅ [Testing Checklist](../../DOCUMENT_MANAGEMENT_CHECKLIST.md)
- 📊 [Implementation Summary](../../DOCUMENT_MANAGEMENT_SUMMARY.md)

## Module Structure

```
documents/
├── document.service.js      # Core business logic
├── document.controller.js   # HTTP request handlers
├── document.routes.js       # API endpoint definitions
└── uploads/                 # Local file storage
    └── {tenantId}/         # Tenant-specific folders
```

## Core Services

### document.service.js

Provides comprehensive document management functionality:

**Document Operations**
- `createDocument(data, user)` - Create new document
- `listDocuments(filters, user)` - List with pagination
- `getDocument(documentId, user)` - Get details
- `updateDocument(documentId, data, user)` - Update metadata
- `deleteDocument(documentId, user, permanent)` - Delete or trash
- `restoreDocument(documentId, user)` - Restore from trash

**Version Control**
- `createDocumentVersion(documentId, data, user)` - New version
- `getDocumentVersions(documentId, user)` - List versions
- `revertToVersion(documentId, versionNumber, user)` - Rollback

**Folder Management**
- `createFolder(data, user)` - Create folder
- `listFolders(filters, user)` - List folders
- `getFolder(folderId, user)` - Get folder details
- `updateFolder(folderId, data, user)` - Update folder
- `deleteFolder(folderId, user, permanent)` - Delete folder

**Sharing**
- `createDocumentShare(documentId, data, user)` - Create share
- `listDocumentShares(documentId, user)` - List shares
- `revokeDocumentShare(shareId, user)` - Revoke share

**Permissions**
- `setDocumentPermissions(documentId, permissions, user)` - Set permissions
- `setFolderPermissions(folderId, permissions, user)` - Set folder permissions

**Templates**
- `createDocumentTemplate(data, user)` - Create template
- `listDocumentTemplates(filters, user)` - List templates
- `generateFromTemplate(templateId, data, user)` - Generate document

**Analytics**
- `getDocumentStatistics(user)` - Get usage statistics
- `getDocumentActivities(documentId, user)` - Get activity log

## API Endpoints

### Documents
```
POST   /api/documents/upload              # Upload document
GET    /api/documents                     # List documents
GET    /api/documents/statistics          # Get statistics
GET    /api/documents/:id                 # Get document
PUT    /api/documents/:id                 # Update document
DELETE /api/documents/:id                 # Delete document
POST   /api/documents/:id/restore         # Restore document
GET    /api/documents/:id/download        # Download document
GET    /api/documents/:id/activities      # Get activities
```

### Versions
```
POST   /api/documents/:id/versions                    # Create version
GET    /api/documents/:id/versions                    # List versions
POST   /api/documents/:id/versions/:ver/revert        # Revert to version
GET    /api/documents/:id/versions/:ver/download      # Download version
```

### Folders
```
POST   /api/documents/folders             # Create folder
GET    /api/documents/folders             # List folders
GET    /api/documents/folders/:id         # Get folder
PUT    /api/documents/folders/:id         # Update folder
DELETE /api/documents/folders/:id         # Delete folder
POST   /api/documents/folders/:id/permissions  # Set permissions
```

### Sharing
```
POST   /api/documents/:id/shares          # Create share
GET    /api/documents/:id/shares          # List shares
DELETE /api/documents/shares/:shareId    # Revoke share
```

### Permissions
```
POST   /api/documents/:id/permissions     # Set document permissions
```

### Templates
```
POST   /api/documents/templates           # Create template
GET    /api/documents/templates           # List templates
POST   /api/documents/templates/:id/generate  # Generate from template
```

## File Upload Configuration

Multer configuration in `document.controller.js`:

```javascript
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(
      process.cwd(), 
      'src', 
      'modules', 
      'documents', 
      'uploads', 
      req.user.tenantId
    );
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
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
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});
```

## Database Models

### Document
Core document model with:
- File metadata (name, size, MIME type)
- Storage information (path, provider, checksum)
- Version tracking
- Status (ACTIVE, ARCHIVED, DELETED)
- Access control
- Usage statistics

### DocumentVersion
Version history with:
- Version number
- File information
- Change log
- Creator and timestamp

### DocumentFolder
Hierarchical folder structure with:
- Name and description
- Parent/child relationships
- Path for navigation
- Visual customization (color, icon)

### DocumentShare
Sharing functionality with:
- Share type (LINK, EMAIL, USER)
- Security (token, password, expiration)
- Permissions
- Usage tracking

### DocumentPermission
Access control with:
- User/role-based permissions
- Action permissions (view, edit, delete, share, manage)

### DocumentTemplate
Template management with:
- Template metadata
- Field definitions
- Category organization
- Usage statistics

### DocumentActivity
Audit trail with:
- Action tracking
- User identification
- Timestamp
- Additional details

## Usage Examples

### Upload Document

```javascript
const formData = new FormData();
formData.append('file', fileObject);
formData.append('name', 'Project Proposal');
formData.append('description', 'Q1 2026 Proposal');
formData.append('folderId', 'folder-uuid');
formData.append('tags', JSON.stringify(['proposal', 'client']));

const document = await documentService.createDocument(formData, user);
```

### Create Folder Hierarchy

```javascript
// Create root folder
const projectsFolder = await documentService.createFolder({
  name: 'Projects',
  description: 'All project documents',
  color: '#2196F3'
}, user);

// Create subfolder
const clientFolder = await documentService.createFolder({
  name: 'Client ABC',
  parentId: projectsFolder.id,
  color: '#4CAF50'
}, user);
```

### Version Control

```javascript
// Create new version
const version = await documentService.createDocumentVersion(
  documentId,
  {
    fileName: 'document-v2.pdf',
    fileSize: 1048576,
    storagePath: '/path/to/v2.pdf',
    changeLog: 'Updated financials section'
  },
  user
);

// Revert to previous version
await documentService.revertToVersion(documentId, 2, user);
```

### Share Document

```javascript
// Create secure share link
const share = await documentService.createDocumentShare(
  documentId,
  {
    shareType: 'LINK',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    password: 'SecurePass123',
    maxDownloads: 10,
    canView: true,
    canDownload: true,
    canEdit: false
  },
  user
);
```

## Security Features

1. **Authentication**: All endpoints require JWT authentication
2. **Tenant Isolation**: Automatic filtering by user's tenant
3. **Permission Checks**: Enforced at service layer
4. **File Integrity**: SHA-256 checksums calculated
5. **Secure Storage**: Files stored outside public directory
6. **Activity Logging**: All actions logged for audit
7. **Soft Delete**: Documents recoverable from trash
8. **Access Control**: User and role-based permissions

## Performance Considerations

1. **Indexes**: Created on tenantId, folderId, status
2. **Pagination**: Default 50 items per page
3. **Lazy Loading**: Related data loaded only when needed
4. **File Streaming**: Large files streamed for download
5. **Checksum Caching**: Stored to avoid recalculation

## Error Handling

All service methods throw errors that are caught by controllers:

```javascript
try {
  const document = await documentService.getDocument(id, user);
  res.json(document);
} catch (error) {
  console.error('Error:', error);
  res.status(404).json({ error: error.message });
}
```

## Testing

### Unit Tests
Test individual service methods:
```javascript
describe('Document Service', () => {
  test('createDocument should create new document', async () => {
    const doc = await documentService.createDocument(data, user);
    expect(doc.name).toBe(data.name);
  });
});
```

### Integration Tests
Test complete API endpoints:
```javascript
describe('POST /api/documents/upload', () => {
  test('should upload document', async () => {
    const response = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', 'test.pdf')
      .field('name', 'Test Doc');
    
    expect(response.status).toBe(201);
  });
});
```

## Migration

To add to existing system:

```bash
# 1. Install dependencies
npm install multer

# 2. Run migration
npx prisma migrate dev --name add_document_management

# 3. Generate Prisma client
npx prisma generate

# 4. Restart server
npm run dev
```

## Troubleshooting

### File Upload Issues
- Check multer configuration
- Verify directory permissions
- Check disk space
- Verify file size limits

### Permission Errors
- Verify user authentication
- Check tenant isolation
- Review permission settings

### Performance Issues
- Add database indexes
- Implement caching
- Use CDN for file delivery
- Consider cloud storage

## Future Enhancements

1. **Preview Generation**: PDF and image thumbnails
2. **OCR**: Text extraction from documents
3. **Workflow Integration**: Approval processes
4. **Advanced Search**: Full-text search
5. **Collaboration**: Real-time co-editing
6. **Analytics**: Usage dashboards

## Support

For issues or questions:
- Check the implementation guide
- Review API documentation
- Examine error logs
- Contact development team

---

**Module Version**: 1.0.0  
**Last Updated**: February 2, 2026  
**Maintainer**: Development Team
