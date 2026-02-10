import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Clock, AlertCircle, CheckCircle2, Filter, Search } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { crmAPI } from '../../api/crm.api';

const ACTIVITY_TYPES = ['TASK', 'CALL', 'EMAIL', 'MEETING', 'TODO'];
const ACTIVITY_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const PRIORITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700'
};

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
};

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [overdueActivities, setOverdueActivities] = useState([]);
  const [upcomingActivities, setUpcomingActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, my, overdue, upcoming
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    type: 'TASK',
    subject: '',
    description: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    dueDate: '',
    dueTime: '',
    assignedTo: '',
    customerId: '',
    contactId: '',
    leadId: '',
    dealId: ''
  });

  const loadActivities = async () => {
    setLoading(true);
    try {
      const params = {
        ...(filterType && { type: filterType }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterPriority && { priority: filterPriority })
      };

      let response;
      if (activeTab === 'my') {
        response = await crmAPI.getMyActivities(params);
      } else if (activeTab === 'overdue') {
        response = await crmAPI.getOverdueActivities({ myOnly: false });
      } else if (activeTab === 'upcoming') {
        response = await crmAPI.getUpcomingActivities({ days: 7, myOnly: false });
      } else {
        response = await crmAPI.getActivities(params);
      }
      
      setActivities(response.data || []);
      
      // Load stats for dashboard
      if (activeTab === 'all') {
        const [overdueRes, upcomingRes] = await Promise.all([
          crmAPI.getOverdueActivities({ myOnly: true }),
          crmAPI.getUpcomingActivities({ days: 7, myOnly: true })
        ]);
        setOverdueActivities(overdueRes.data || []);
        setUpcomingActivities(upcomingRes.data || []);
      }
    } catch (err) {
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [activeTab, filterType, filterStatus, filterPriority]);

  const resetForm = () => {
    setFormData({
      type: 'TASK',
      subject: '',
      description: '',
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: '',
      dueTime: '',
      assignedTo: '',
      customerId: '',
      contactId: '',
      leadId: '',
      dealId: ''
    });
    setEditingActivity(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...formData };
      
      if (editingActivity) {
        await crmAPI.updateActivity(editingActivity.id, payload);
      } else {
        await crmAPI.createActivity(payload);
      }
      
      setShowModal(false);
      resetForm();
      loadActivities();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setFormData({
      type: activity.type || 'TASK',
      subject: activity.subject || '',
      description: activity.description || '',
      status: activity.status || 'PENDING',
      priority: activity.priority || 'MEDIUM',
      dueDate: activity.dueDate ? new Date(activity.dueDate).toISOString().split('T')[0] : '',
      dueTime: activity.dueTime || '',
      assignedTo: activity.assignedTo || '',
      customerId: activity.customerId || '',
      contactId: activity.contactId || '',
      leadId: activity.leadId || '',
      dealId: activity.dealId || ''
    });
    setShowModal(true);
  };

  const handleComplete = async (id) => {
    try {
      await crmAPI.completeActivity(id, { outcome: 'Completed successfully' });
      loadActivities();
    } catch (err) {
      setError('Failed to complete activity');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this activity?')) return;
    try {
      await crmAPI.deleteActivity(id);
      loadActivities();
    } catch (err) {
      setError('Failed to delete activity');
    }
  };

  const filteredActivities = activities.filter(activity =>
    activity.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: activities.length,
    overdue: overdueActivities.length,
    upcoming: upcomingActivities.length,
    pending: activities.filter(a => a.status === 'PENDING').length,
    completed: activities.filter(a => a.status === 'COMPLETED').length
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Activity Dashboard</h1>
            <p className="text-primary-600 mt-1">Track tasks, calls, meetings, and to-dos</p>
          </div>
          <button
            className="btn-modern btn-primary flex items-center space-x-2"
            onClick={() => setShowModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Add Activity</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Activities', value: stats.total, icon: Calendar, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Overdue', value: stats.overdue, icon: AlertCircle, bg: 'bg-red-50', color: 'text-red-600' },
            { label: 'Upcoming', value: stats.upcoming, icon: Clock, bg: 'bg-purple-50', color: 'text-purple-600' },
            { label: 'Pending', value: stats.pending, icon: Calendar, bg: 'bg-yellow-50', color: 'text-yellow-600' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle2, bg: 'bg-green-50', color: 'text-green-600' }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="modern-card-elevated p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-primary-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="modern-card-elevated">
          <div className="border-b border-primary-200">
            <div className="flex space-x-4 px-4">
              {[
                { id: 'all', label: 'All Activities' },
                { id: 'my', label: 'My Activities' },
                { id: 'overdue', label: 'Overdue' },
                { id: 'upcoming', label: 'Upcoming' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-700'
                      : 'border-transparent text-primary-500 hover:text-primary-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-primary-200 bg-primary-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-modern pl-10"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-modern"
              >
                <option value="">All Types</option>
                {ACTIVITY_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-modern"
              >
                <option value="">All Status</option>
                {ACTIVITY_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="input-modern"
              >
                <option value="">All Priorities</option>
                {PRIORITY_LEVELS.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Activities List */}
          <div className="p-4">
            {loading ? (
              <LoadingSpinner />
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12 text-primary-500">
                No activities found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredActivities.map(activity => (
                  <div
                    key={activity.id}
                    className="p-4 border border-primary-200 rounded-lg hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[activity.status]}`}>
                            {activity.status}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORITY_COLORS[activity.priority]}`}>
                            {activity.priority}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-700 font-medium">
                            {activity.type}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-primary-900 mb-1">
                          {activity.subject}
                        </h3>
                        {activity.description && (
                          <p className="text-sm text-primary-600 mb-2">{activity.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-primary-500">
                          {activity.dueDate && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(activity.dueDate).toLocaleDateString()}</span>
                              {activity.dueTime && <span>at {activity.dueTime}</span>}
                            </div>
                          )}
                          {activity.assignee && (
                            <div className="flex items-center space-x-1">
                              <span>Assigned to: {activity.assignee.email}</span>
                            </div>
                          )}
                          {activity.customer && (
                            <div className="flex items-center space-x-1">
                              <span>Customer: {activity.customer.name}</span>
                            </div>
                          )}
                          {activity.deal && (
                            <div className="flex items-center space-x-1">
                              <span>Deal: {activity.deal.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {activity.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleComplete(activity.id)}
                            className="btn-modern btn-sm bg-green-50 text-green-600 hover:bg-green-100"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(activity)}
                          className="btn-modern btn-sm bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(activity.id)}
                          className="btn-modern btn-sm bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-primary-200">
                <h3 className="text-lg font-semibold text-primary-900">
                  {editingActivity ? 'Edit Activity' : 'Create Activity'}
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Type *</label>
                    <select
                      className="input-modern mt-1"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                    >
                      {ACTIVITY_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Priority</label>
                    <select
                      className="input-modern mt-1"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      {PRIORITY_LEVELS.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700">Subject *</label>
                  <input
                    type="text"
                    className="input-modern mt-1"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700">Description</label>
                  <textarea
                    className="input-modern mt-1"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Due Date</label>
                    <input
                      type="date"
                      className="input-modern mt-1"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Due Time</label>
                    <input
                      type="time"
                      className="input-modern mt-1"
                      value={formData.dueTime}
                      onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700">Status</label>
                  <select
                    className="input-modern mt-1"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {ACTIVITY_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn-modern btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-modern btn-primary"
                  >
                    {loading ? 'Saving...' : editingActivity ? 'Update Activity' : 'Create Activity'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Activities;
