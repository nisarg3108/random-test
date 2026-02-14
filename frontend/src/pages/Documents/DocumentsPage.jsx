import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Folder,
  File,
  Upload,
  FolderPlus,
  MoreVertical,
  Search,
  Download,
  Share2,
  Trash2,
  Edit,
  RotateCcw,
  Home,
  FileText,
  Image,
  FileArchive,
  Video,
  Music
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
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
  
  const [menuOpen, setMenuOpen] = useState(null);
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
      pathParts.forEach((part, index) => {
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
    setMenuOpen(null);
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
    setMenuOpen(null);
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-600" />;
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-600" />;
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-600" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5 text-green-600" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <FileArchive className="w-5 h-5 text-orange-600" />;
    return <File className="w-5 h-5 text-gray-600" />;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
            <p className="text-gray-600 mt-1">Manage and organize your documents</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setFolderDialogOpen(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </button>
            <button
              onClick={() => setUploadDialogOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">×</button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-700 hover:text-green-900">×</button>
          </div>
        )}

        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-gray-400">/</span>}
              <button
                onClick={() => handleBreadcrumbClick(crumb.id)}
                className={`flex items-center gap-1 ${
                  index === breadcrumbs.length - 1
                    ? 'text-gray-900 font-medium'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                {index === 0 && <Home className="w-4 h-4" />}
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="modern-card-elevated p-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedStatus('ACTIVE')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === 'ACTIVE'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setSelectedStatus('ARCHIVED')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === 'ARCHIVED'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Archived
              </button>
              <button
                onClick={() => setSelectedStatus('DELETED')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === 'DELETED'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Deleted
              </button>
            </div>
            <button
              onClick={() => loadData(currentFolder?.id)}
              className="btn-secondary"
            >
              Search
            </button>
          </div>
        </div>

        {/* Folders */}
        {folders.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Folders</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {folders.map((folder) => (
                <div key={folder.id} className="modern-card-elevated p-4 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div
                      onClick={() => handleFolderClick(folder.id)}
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      <Folder className="w-10 h-10 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{folder.name}</p>
                        <p className="text-sm text-gray-500">{folder._count?.documents || 0} documents</p>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === folder.id ? null : folder.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                      {menuOpen === folder.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <button
                            onClick={() => handleDelete(folder, 'folder')}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
          {documents.length === 0 ? (
            <div className="modern-card-elevated p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600 mb-6">Upload your first document to get started</p>
              <button
                onClick={() => setUploadDialogOpen(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {documents.map((document) => (
                <div key={document.id} className="modern-card-elevated p-4 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div
                      onClick={() => handleDocumentClick(document)}
                      className="flex items-start gap-3 flex-1 cursor-pointer"
                    >
                      {getFileIcon(document.mimeType)}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate" title={document.name}>
                          {document.name}
                        </p>
                        <p className="text-xs text-gray-500">{formatBytes(document.fileSize)}</p>
                        <p className="text-xs text-gray-500">v{document.version}</p>
                        <p className="text-xs text-gray-500">{formatDate(document.createdAt)}</p>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === document.id ? null : document.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                      {menuOpen === document.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          {selectedStatus === 'ACTIVE' && (
                            <>
                              <button
                                onClick={() => {
                                  handleDownload(document);
                                  setMenuOpen(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </button>
                              <button
                                onClick={() => handleDelete(document, 'document')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Move to Trash
                              </button>
                            </>
                          )}
                          {selectedStatus === 'DELETED' && (
                            <>
                              <button
                                onClick={() => handleRestore(document)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Restore
                              </button>
                              <button
                                onClick={() => handleDelete(document, 'document', true)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Permanently
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <UploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={() => {
          setUploadDialogOpen(false);
          setSuccess('Document uploaded successfully');
          loadData(currentFolder?.id);
        }}
        folderId={currentFolder?.id}
      />
      
      <FolderDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onSuccess={() => {
          setFolderDialogOpen(false);
          setSuccess('Folder created successfully');
          loadData(currentFolder?.id);
        }}
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
    </Layout>
  );
};

export default DocumentsPage;
