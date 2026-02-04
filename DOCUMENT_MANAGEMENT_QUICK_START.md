# Document Management - Quick Start Guide

## Getting Started in 5 Minutes

### Step 1: Install Dependencies (30 seconds)

```bash
cd backend
npm install multer
```

### Step 2: Run Database Migration (1 minute)

```bash
cd backend
npx prisma migrate dev --name add_document_management
```

This creates all necessary tables:
- DocumentFolder
- Document
- DocumentVersion
- DocumentTemplate
- DocumentShare
- DocumentPermission
- DocumentFolderPermission
- DocumentActivity
- DocumentComment

### Step 3: Start the Server (30 seconds)

```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

### Step 4: Access Document Management (10 seconds)

Navigate to: `http://localhost:5173/documents`

### Step 5: Try It Out! (3 minutes)

1. **Create a folder**: Click "New Folder" → Enter "Projects" → Save
2. **Upload a document**: Click "Upload" → Select a file → Fill details → Upload
3. **View document**: Click on the uploaded document to see details
4. **Create a version**: In document details → Versions tab → Upload New Version
5. **Share a document**: In document details → Sharing tab → Create Share Link

## Key Features at Your Fingertips

### 📁 Folder Organization
- Create nested folder structures
- Color code folders for visual organization
- Navigate with breadcrumbs
- Search across all folders

### 📄 Document Management
- Drag-and-drop upload (up to 100MB)
- Rich metadata (name, description, tags)
- Status tracking (Active, Archived, Deleted)
- Quick actions via context menu

### 🔄 Version Control
- Automatic version tracking
- Version history with change logs
- Revert to any previous version
- Download specific versions

### 🔗 Sharing & Permissions
- Generate shareable links
- Set expiration dates
- Password protection
- Granular permissions (view, download, edit, share)

### 📊 Analytics
- View and download counts
- Activity timeline
- Usage statistics

## API Quick Reference

### Upload a Document
```bash
curl -X POST http://localhost:5000/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "name=Important Document" \
  -F "description=Quarterly report" \
  -F 'tags=["report", "q1"]'
```

### List Documents
```bash
curl http://localhost:5000/api/documents?status=ACTIVE \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Download Document
```bash
curl http://localhost:5000/api/documents/{documentId}/download \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o downloaded-file.pdf
```

### Create Share Link
```bash
curl -X POST http://localhost:5000/api/documents/{documentId}/shares \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shareType": "LINK",
    "canView": true,
    "canDownload": true,
    "expiresAt": "2026-12-31T23:59:59Z"
  }'
```

## Common Use Cases

### 1. Employee Onboarding Documents
```javascript
// Create folder structure
await folderAPI.createFolder({ name: 'HR', color: '#4CAF50' });
await folderAPI.createFolder({ name: 'Onboarding', parentId: hrFolderId });

// Upload policy documents
const formData = new FormData();
formData.append('file', policyFile);
formData.append('name', 'Employee Handbook');
formData.append('folderId', onboardingFolderId);
formData.append('tags', JSON.stringify(['policy', 'required']));
await documentAPI.uploadDocument(formData);
```

### 2. Contract Management
```javascript
// Create contract template
const templateData = new FormData();
templateData.append('file', contractTemplate);
templateData.append('name', 'Standard Service Contract');
templateData.append('category', 'CONTRACT');
templateData.append('fields', JSON.stringify([
  { name: 'clientName', type: 'text', required: true },
  { name: 'startDate', type: 'date', required: true },
  { name: 'amount', type: 'number', required: true }
]));
await templateAPI.createTemplate(templateData);

// Generate from template
await templateAPI.generateFromTemplate(templateId, {
  clientName: 'Acme Corp',
  startDate: '2026-02-01',
  amount: 50000
});
```

### 3. Project Documentation
```javascript
// Create project folder
const projectFolder = await folderAPI.createFolder({
  name: 'Website Redesign 2026',
  description: 'All documents for website project',
  color: '#2196F3'
});

// Upload project files with tags
const files = ['requirements.pdf', 'wireframes.pdf', 'design.pdf'];
for (const file of files) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folderId', projectFolder.id);
  formData.append('tags', JSON.stringify(['project', 'website']));
  await documentAPI.uploadDocument(formData);
}
```

### 4. Secure Document Sharing
```javascript
// Share with password and expiration
const share = await shareAPI.createShare(documentId, {
  shareType: 'LINK',
  password: 'SecurePass123',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  maxDownloads: 10,
  canView: true,
  canDownload: true,
  canEdit: false
});

console.log(`Share link: ${window.location.origin}/share/${share.shareToken}`);
```

## Frontend Component Usage

### Using UploadDialog
```javascript
import UploadDialog from '../../components/documents/UploadDialog';

function MyComponent() {
  const [uploadOpen, setUploadOpen] = useState(false);
  
  const handleUploadSuccess = () => {
    setUploadOpen(false);
    // Refresh document list
  };
  
  return (
    <>
      <Button onClick={() => setUploadOpen(true)}>Upload</Button>
      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleUploadSuccess}
        folderId={currentFolderId}
      />
    </>
  );
}
```

### Using DocumentDetailsDialog
```javascript
import DocumentDetailsDialog from '../../components/documents/DocumentDetailsDialog';

function MyComponent() {
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  return (
    <DocumentDetailsDialog
      open={!!selectedDoc}
      onClose={() => setSelectedDoc(null)}
      document={selectedDoc}
      onDownload={(doc) => downloadDocument(doc)}
      onDelete={(doc) => deleteDocument(doc)}
      onUpdate={() => refreshList()}
    />
  );
}
```

## Tips & Best Practices

### 1. Organize with Folders
- Create a logical folder hierarchy
- Use color coding for different departments or projects
- Keep folder names short and descriptive

### 2. Use Tags Effectively
- Tag documents with multiple relevant keywords
- Use consistent tag naming conventions
- Tags make searching much easier

### 3. Version Control
- Always add a change log when creating new versions
- Don't delete old versions - they're kept for history
- Use version revert feature when needed

### 4. Sharing Securely
- Set expiration dates on shared links
- Use password protection for sensitive documents
- Monitor share activity in the activity log
- Revoke shares when no longer needed

### 5. Permissions Management
- Set folder permissions to apply to all contained documents
- Review permissions regularly
- Use role-based permissions for consistency

## Troubleshooting

### Upload Fails
**Problem**: File upload returns error  
**Solution**: 
- Check file size (max 100MB)
- Verify file type is allowed
- Ensure stable internet connection

### Can't See Documents
**Problem**: Documents list is empty  
**Solution**:
- Check folder filter (you might be in an empty folder)
- Verify status filter (Active/Archived/Deleted)
- Check your permissions

### Download Not Working
**Problem**: Download button doesn't work  
**Solution**:
- Check you have download permission
- Verify document still exists (not permanently deleted)
- Check browser popup blocker

## Next Steps

1. **Customize Storage**: Switch from LOCAL to S3/Azure for production
2. **Add Preview**: Implement PDF and image preview
3. **Set Permissions**: Configure role-based access control
4. **Create Templates**: Build templates for common documents
5. **Monitor Usage**: Review activity logs and statistics

## Need Help?

- 📖 Full Documentation: [DOCUMENT_MANAGEMENT_IMPLEMENTATION.md](./DOCUMENT_MANAGEMENT_IMPLEMENTATION.md)
- 🔧 Backend Code: `backend/src/modules/documents/`
- 💻 Frontend Code: `frontend/src/pages/Documents/`
- 🗄️ Database Schema: `backend/prisma/schema.prisma`

Happy Document Managing! 📁✨
