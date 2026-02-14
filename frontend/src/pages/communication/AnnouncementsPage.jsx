import React, { useState, useEffect } from 'react';
import { Plus, Pin, Edit, Trash2, Megaphone, Eye, X, Paperclip, AlertCircle } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementAsRead
} from '../../api/communication';
import { useAnnouncementsWebSocket } from '../../hooks/useWebSocket';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    targetType: 'ALL',
    isPinned: false,
    expiresAt: ''
  });

  const { newAnnouncement } = useAnnouncementsWebSocket();

  const priorityColors = {
    LOW: 'bg-gray-100 text-gray-800',
    NORMAL: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800'
  };

  const priorityBorders = {
    LOW: 'border-gray-400',
    NORMAL: 'border-blue-400',
    HIGH: 'border-orange-400',
    URGENT: 'border-red-400'
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    if (newAnnouncement) {
      setAnnouncements(prev => {
        if (prev.some(a => a.id === newAnnouncement.id)) return prev;
        const updated = [newAnnouncement, ...prev];
        return updated.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      });
    }
  }, [newAnnouncement]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await getAnnouncements({ active: true });
      setAnnouncements(response.data.announcements);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (announcement = null) => {
    if (announcement) {
      setSelectedAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        targetType: announcement.targetType,
        isPinned: announcement.isPinned,
        expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().slice(0, 16) : ''
      });
    } else {
      setSelectedAnnouncement(null);
      setFormData({
        title: '',
        content: '',
        priority: 'NORMAL',
        targetType: 'ALL',
        isPinned: false,
        expiresAt: ''
      });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
      };

      if (selectedAnnouncement) {
        await updateAnnouncement(selectedAnnouncement.id, data);
      } else {
        await createAnnouncement(data);
      }

      loadAnnouncements();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving announcement:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteAnnouncement(id);
        loadAnnouncements();
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    }
  };

  const handleView = async (announcement) => {
    setSelectedAnnouncement(announcement);
    setViewDialog(true);
    
    try {
      await markAnnouncementAsRead(announcement.id);
      setAnnouncements(announcements.map(a =>
        a.id === announcement.id ? { ...a, reads: [{ readAt: new Date() }] } : a
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const isUnread = (announcement) => !announcement.reads || announcement.reads.length === 0;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary-900 flex items-center">
              <Megaphone className="w-8 h-8 mr-3 text-blue-600" />
              Announcements
            </h1>
            <p className="text-primary-600 mt-1">Company-wide announcements and updates</p>
          </div>
          <button
            onClick={() => handleOpenDialog()}
            className="btn-modern btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </button>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : sortedAnnouncements.length === 0 ? (
          <div className="modern-card-elevated text-center py-12">
            <Megaphone className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No announcements yet</h3>
            <p className="text-gray-600">Create your first announcement to inform your team</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`modern-card-elevated border-l-4 ${priorityBorders[announcement.priority]} ${
                  isUnread(announcement) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {isUnread(announcement) && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                        <h3 className="text-lg font-semibold text-primary-900">
                          {announcement.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[announcement.priority]}`}>
                          {announcement.priority}
                        </span>
                        {announcement.isPinned && (
                          <span className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            <Pin className="w-3 h-3 mr-1" />
                            Pinned
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-primary-600 mb-3">
                        Published {formatDate(announcement.publishedAt)}
                        {announcement.expiresAt && (
                          <> • Expires {formatDate(announcement.expiresAt)}</>
                        )}
                      </p>
                      
                      <p className="text-primary-900 line-clamp-2">
                        {announcement.content}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {announcement._count?.reads || 0} reads
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {announcement.targetType}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleView(announcement)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDialog(announcement)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="modern-card-elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-primary-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-primary-900">
                {selectedAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
              </h3>
              <button onClick={() => setOpenDialog(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-modern"
                  placeholder="Enter announcement title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Content *</label>
                <textarea
                  required
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input-modern"
                  placeholder="Enter announcement content"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input-modern"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Target Audience</label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                    className="input-modern"
                  >
                    <option value="ALL">All Users</option>
                    <option value="DEPARTMENT">Department</option>
                    <option value="ROLE">Role</option>
                    <option value="SPECIFIC_USERS">Specific Users</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Expires At</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="input-modern"
                />
              </div>
              
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPinned: !formData.isPinned })}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    formData.isPinned
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Pin className="w-4 h-4" />
                  <span>{formData.isPinned ? 'Pinned' : 'Pin This'}</span>
                </button>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setOpenDialog(false)}
                  className="btn-modern btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modern btn-primary"
                >
                  {selectedAnnouncement ? 'Update' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewDialog && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="modern-card-elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-primary-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-primary-900">{selectedAnnouncement.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[selectedAnnouncement.priority]}`}>
                  {selectedAnnouncement.priority}
                </span>
              </div>
              <button onClick={() => setViewDialog(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  Published {formatDate(selectedAnnouncement.publishedAt)}
                  {selectedAnnouncement.expiresAt && (
                    <> • Expires {formatDate(selectedAnnouncement.expiresAt)}</>
                  )}
                </div>
              </div>
              
              <p className="text-primary-900 whitespace-pre-wrap mb-4">
                {selectedAnnouncement.content}
              </p>
              
              <div className="flex gap-2 pt-4 border-t border-primary-200">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {selectedAnnouncement._count?.reads || 0} reads
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {selectedAnnouncement.targetType}
                </span>
                {selectedAnnouncement.isPinned && (
                  <span className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    <Pin className="w-3 h-3 mr-1" />
                    Pinned
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AnnouncementsPage;
