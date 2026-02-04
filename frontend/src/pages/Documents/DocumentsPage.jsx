import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Chip,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Upload as UploadIcon,
  CreateNewFolder as NewFolderIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Restore as RestoreIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Archive as ArchiveIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { documentAPI, folderAPI } from '../../api/documents';
import UploadDialog from '../../components/documents/UploadDialog';
import FolderDialog from '../../components/documents/FolderDialog';
import DocumentDetailsDialog from '../../components/documents/DocumentDetailsDialog';
import { formatBytes, formatDate } from '../../utils/format';

const DocumentsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Documents' }]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ACTIVE');
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuItem, setMenuItem] = useState(null);
  const [menuType, setMenuType] = useState(null);
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const folderId = searchParams.get('folder');
    loadData(folderId);
  }, [searchParams]);

  const loadData = async (folderId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const [documentsRes, foldersRes] = await Promise.all([
        documentAPI.listDocuments({
          folderId: folderId || null,
          status: selectedStatus,
          search: searchQuery
        }),
        folderAPI.listFolders({ parentId: folderId || null })
      ]);
      
      setDocuments(documentsRes.data.documents || []);
      setFolders(foldersRes.data || []);
      
      if (folderId) {
        const folderRes = await folderAPI.getFolder(folderId);
        setCurrentFolder(folderRes.data);
        buildBreadcrumbs(folderRes.data);
      } else {
        setCurrentFolder(null);
        setBreadcrumbs([{ id: null, name: 'Documents' }]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const buildBreadcrumbs = (folder) => {
    const crumbs = [{ id: null, name: 'Documents' }];
    
    if (folder) {
      const pathParts = folder.path.split('/').filter(p => p);
      let currentPath = '';
      
      pathParts.forEach((part, index) => {
        currentPath += '/' + part;
        crumbs.push({
          id: index === pathParts.length - 1 ? folder.id : null,
          name: part
        });
      });
    }
    
    setBreadcrumbs(crumbs);
  };

  const handleFolderClick = (folderId) => {
    setSearchParams({ folder: folderId });
  };

  const handleBreadcrumbClick = (folderId) => {
    if (folderId) {
      setSearchParams({ folder: folderId });
    } else {
      setSearchParams({});
    }
  };

  const handleDocumentClick = async (document) => {
    setSelectedDocument(document);
    setDetailsDialogOpen(true);
  };

  const handleMenuOpen = (event, item, type) => {
    setAnchorEl(event.currentTarget);
    setMenuItem(item);
    setMenuType(type);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuItem(null);
    setMenuType(null);
  };

  const handleDownload = async (document) => {
    try {
      const response = await documentAPI.downloadDocument(document.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess('Document downloaded successfully');
    } catch (err) {
      console.error('Error downloading:', err);
      setError('Failed to download document');
    }
  };

  const handleDelete = async (item, type, permanent = false) => {
    try {
      if (type === 'document') {
        await documentAPI.deleteDocument(item.id, permanent);
      } else {
        await folderAPI.deleteFolder(item.id, permanent);
      }
      setSuccess(`${type === 'document' ? 'Document' : 'Folder'} deleted successfully`);
      loadData(currentFolder?.id);
    } catch (err) {
      console.error('Error deleting:', err);
      setError(`Failed to delete ${type}`);
    }
    handleMenuClose();
  };

  const handleRestore = async (document) => {
    try {
      await documentAPI.restoreDocument(document.id);
      setSuccess('Document restored successfully');
      loadData(currentFolder?.id);
    } catch (err) {
      console.error('Error restoring:', err);
      setError('Failed to restore document');
    }
    handleMenuClose();
  };

  const handleUploadSuccess = () => {
    setUploadDialogOpen(false);
    setSuccess('Document uploaded successfully');
    loadData(currentFolder?.id);
  };

  const handleFolderCreated = () => {
    setFolderDialogOpen(false);
    setSuccess('Folder created successfully');
    loadData(currentFolder?.id);
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <ImageIcon color="primary" />;
    if (mimeType === 'application/pdf') return <PdfIcon color="error" />;
    if (mimeType.startsWith('video/')) return <VideoIcon color="secondary" />;
    if (mimeType.startsWith('audio/')) return <AudioIcon color="info" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <ArchiveIcon color="warning" />;
    return <FileIcon color="action" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          Document Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<NewFolderIcon />}
            onClick={() => setFolderDialogOpen(true)}
          >
            New Folder
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        {breadcrumbs.map((crumb, index) => (
          <Link
            key={index}
            component="button"
            variant="body1"
            onClick={() => handleBreadcrumbClick(crumb.id)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: index === breadcrumbs.length - 1 ? 'text.primary' : 'primary.main',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {index === 0 && <HomeIcon sx={{ mr: 0.5, fontSize: 20 }} />}
            {crumb.name}
          </Link>
        ))}
      </Breadcrumbs>

      {/* Search & Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label="Active"
            color={selectedStatus === 'ACTIVE' ? 'primary' : 'default'}
            onClick={() => setSelectedStatus('ACTIVE')}
          />
          <Chip
            label="Archived"
            color={selectedStatus === 'ARCHIVED' ? 'primary' : 'default'}
            onClick={() => setSelectedStatus('ARCHIVED')}
          />
          <Chip
            label="Deleted"
            color={selectedStatus === 'DELETED' ? 'primary' : 'default'}
            onClick={() => setSelectedStatus('DELETED')}
          />
        </Box>
        <Button variant="text" onClick={() => loadData(currentFolder?.id)}>
          Search
        </Button>
      </Box>

      {/* Folders */}
      {folders.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Folders
          </Typography>
          <Grid container spacing={2}>
            {folders.map((folder) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={folder.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 },
                    transition: 'box-shadow 0.2s'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}
                        onClick={() => handleFolderClick(folder.id)}
                      >
                        <FolderIcon
                          sx={{ fontSize: 40, color: folder.color || 'primary.main', mr: 2 }}
                        />
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {folder.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {folder._count?.documents || 0} documents
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, folder, 'folder')}
                      >
                        <MoreIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Documents */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Documents
        </Typography>
        {documents.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <DescriptionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No documents found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload your first document to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload Document
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {documents.map((document) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={document.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 },
                    transition: 'box-shadow 0.2s'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'start', flexGrow: 1 }}
                        onClick={() => handleDocumentClick(document)}
                      >
                        <Box sx={{ mr: 2 }}>
                          {getFileIcon(document.mimeType)}
                        </Box>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Tooltip title={document.name}>
                            <Typography
                              variant="subtitle2"
                              fontWeight="bold"
                              noWrap
                              sx={{ mb: 0.5 }}
                            >
                              {document.name}
                            </Typography>
                          </Tooltip>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {formatBytes(document.fileSize)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            v{document.version}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {formatDate(document.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, document, 'document')}
                      >
                        <MoreIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {menuType === 'document' && selectedStatus === 'ACTIVE' && (
          [
            <MenuItem key="download" onClick={() => {
              handleDownload(menuItem);
              handleMenuClose();
            }}>
              <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
              Download
            </MenuItem>,
            <MenuItem key="share" onClick={handleMenuClose}>
              <ShareIcon sx={{ mr: 1 }} fontSize="small" />
              Share
            </MenuItem>,
            <MenuItem key="delete" onClick={() => handleDelete(menuItem, 'document')}>
              <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
              Move to Trash
            </MenuItem>
          ]
        )}
        {menuType === 'document' && selectedStatus === 'DELETED' && (
          [
            <MenuItem key="restore" onClick={() => handleRestore(menuItem)}>
              <RestoreIcon sx={{ mr: 1 }} fontSize="small" />
              Restore
            </MenuItem>,
            <MenuItem key="delete-permanent" onClick={() => handleDelete(menuItem, 'document', true)}>
              <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
              Delete Permanently
            </MenuItem>
          ]
        )}
        {menuType === 'folder' && (
          [
            <MenuItem key="edit" onClick={handleMenuClose}>
              <EditIcon sx={{ mr: 1 }} fontSize="small" />
              Edit
            </MenuItem>,
            <MenuItem key="delete" onClick={() => handleDelete(menuItem, 'folder')}>
              <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
              Delete
            </MenuItem>
          ]
        )}
      </Menu>

      {/* Dialogs */}
      <UploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
        folderId={currentFolder?.id}
      />
      
      <FolderDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onSuccess={handleFolderCreated}
        parentId={currentFolder?.id}
      />
      
      <DocumentDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        document={selectedDocument}
        onDownload={handleDownload}
        onDelete={(doc) => handleDelete(doc, 'document')}
        onUpdate={() => loadData(currentFolder?.id)}
      />
    </Box>
  );
};

export default DocumentsPage;
