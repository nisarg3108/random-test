import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Save, Send, AlertCircle, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '../../api/http';
import Layout from '../../components/layout/Layout';

const TimesheetEntry = () => {
  const [currentWeek, setCurrentWeek] = useState(getMonday(new Date()));
  const [timesheet, setTimesheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newEntry, setNewEntry] = useState({
    projectId: '',
    milestoneId: '',
    date: '',
    hours: '',
    taskDescription: '',
    billable: true,
  });

  // Get Monday of current week
  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  }

  // Get week dates
  const getWeekDates = (monday) => {
    const dates = [];
    const start = new Date(monday);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates(currentWeek);

  // Fetch or create timesheet
  const fetchTimesheet = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/timesheets/get-or-create', {
        params: { weekStartDate: currentWeek }
      });
      setTimesheet(response.data);
      setEntries(response.data.entries || []);
    } catch (err) {
      setError('Failed to load timesheet');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's active projects
  const fetchProjects = async () => {
    try {
      const response = await apiClient.get('/projects');
      setProjects(response.data.filter(p => p.status === 'IN_PROGRESS'));
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  // Fetch milestones for selected project
  const fetchMilestones = async (projectId) => {
    if (milestones[projectId]) return; // Already loaded
    
    try {
      const response = await apiClient.get(`/projects/${projectId}/milestones`);
      setMilestones(prev => ({
        ...prev,
        [projectId]: response.data
      }));
    } catch (err) {
      console.error('Failed to load milestones', err);
    }
  };

  useEffect(() => {
    fetchTimesheet();
    fetchProjects();
  }, [currentWeek]);

  // Add entry to timesheet
  const handleAddEntry = () => {
    if (!newEntry.projectId || !newEntry.date || !newEntry.hours || !newEntry.taskDescription) {
      setError('Please fill all required fields');
      return;
    }

    if (parseFloat(newEntry.hours) <= 0 || parseFloat(newEntry.hours) > 24) {
      setError('Hours must be between 0 and 24');
      return;
    }

    const entry = {
      id: Date.now(), // Temporary ID
      ...newEntry,
      hours: parseFloat(newEntry.hours),
    };

    setEntries([...entries, entry]);
    setNewEntry({
      projectId: '',
      milestoneId: '',
      date: '',
      hours: '',
      taskDescription: '',
      billable: true,
    });
    setError('');
  };

  // Remove entry
  const handleRemoveEntry = (entryId) => {
    setEntries(entries.filter(e => e.id !== entryId));
  };

  // Save timesheet (draft)
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      await apiClient.put(`/timesheets/${timesheet.id}`, {
        entries: entries.map(e => ({
          projectId: e.projectId,
          milestoneId: e.milestoneId || undefined,
          date: e.date,
          hours: e.hours,
          taskDescription: e.taskDescription,
          billable: e.billable,
        }))
      });

      setSuccess('Timesheet saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchTimesheet(); // Refresh to get saved IDs
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save timesheet');
    } finally {
      setSaving(false);
    }
  };

  // Submit timesheet for approval
  const handleSubmit = async () => {
    if (entries.length === 0) {
      setError('Cannot submit an empty timesheet');
      return;
    }

    if (!window.confirm('Submit timesheet for approval? You won\'t be able to edit it after submission.')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      // First save any unsaved changes
      await apiClient.put(`/timesheets/${timesheet.id}`, {
        entries: entries.map(e => ({
          projectId: e.projectId,
          milestoneId: e.milestoneId || undefined,
          date: e.date,
          hours: e.hours,
          taskDescription: e.taskDescription,
          billable: e.billable,
        }))
      });

      // Then submit
      await apiClient.post(`/timesheets/${timesheet.id}/submit`);
      
      setSuccess('Timesheet submitted successfully!');
      setTimeout(() => {
        fetchTimesheet();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit timesheet');
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals
  const totalHours = entries.reduce((sum, e) => sum + parseFloat(e.hours || 0), 0);
  const billableHours = entries.filter(e => e.billable).reduce((sum, e) => sum + parseFloat(e.hours || 0), 0);

  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  const getStatusBadge = (status) => {
    const badges = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', text: 'Draft' },
      SUBMITTED: { color: 'bg-blue-100 text-blue-800', text: 'Submitted' },
      APPROVED: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      REJECTED: { color: 'bg-red-100 text-red-800', text: 'Rejected' },
    };
    const badge = badges[status] || badges.DRAFT;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const isDraftOrRejected = timesheet?.status === 'DRAFT' || timesheet?.status === 'REJECTED';

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Timesheet Entry</h1>
          <p className="text-gray-600">Log your work hours for the week</p>
        </div>

        {/* Week Selector */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                const prevWeek = new Date(currentWeek);
                prevWeek.setDate(prevWeek.getDate() - 7);
                setCurrentWeek(prevWeek.toISOString().split('T')[0]);
              }}
              disabled={!isDraftOrRejected}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              ← Previous Week
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Calendar className="h-5 w-5 text-gray-600" />
                <span className="text-lg font-semibold text-gray-900">
                  Week of {new Date(currentWeek).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {timesheet && getStatusBadge(timesheet.status)}
            </div>

            <button
              onClick={() => {
                const nextWeek = new Date(currentWeek);
                nextWeek.setDate(nextWeek.getDate() + 7);
                setCurrentWeek(nextWeek.toISOString().split('T')[0]);
              }}
              disabled={!isDraftOrRejected}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next Week →
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">×</button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-green-800">{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">×</button>
          </div>
        )}

        {timesheet?.rejectionReason && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-yellow-800 mb-1">Rejection Reason:</p>
            <p className="text-sm text-yellow-700">{timesheet.rejectionReason}</p>
          </div>
        )}

        {/* Add Entry Form (only for draft/rejected) */}
        {isDraftOrRejected && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Add Time Entry
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
                <select
                  value={newEntry.projectId}
                  onChange={(e) => {
                    setNewEntry({ ...newEntry, projectId: e.target.value, milestoneId: '' });
                    if (e.target.value) fetchMilestones(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.projectName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Milestone</label>
                <select
                  value={newEntry.milestoneId}
                  onChange={(e) => setNewEntry({ ...newEntry, milestoneId: e.target.value })}
                  disabled={!newEntry.projectId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Milestone (Optional)</option>
                  {milestones[newEntry.projectId]?.map(m => (
                    <option key={m.id} value={m.id}>{m.milestoneName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <select
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Date</option>
                  {weekDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={newEntry.hours}
                  onChange={(e) => setNewEntry({ ...newEntry, hours: e.target.value })}
                  placeholder="8.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Description *</label>
                <input
                  type="text"
                  value={newEntry.taskDescription}
                  onChange={(e) => setNewEntry({ ...newEntry, taskDescription: e.target.value })}
                  placeholder="Describe what you worked on..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="billable"
                  checked={newEntry.billable}
                  onChange={(e) => setNewEntry({ ...newEntry, billable: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="billable" className="ml-2 block text-sm text-gray-700">
                  Billable
                </label>
              </div>
            </div>

            <button
              onClick={handleAddEntry}
              className="mt-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </button>
          </div>
        )}

        {/* Entries List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Time Entries</h2>
          </div>

          {entries.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p>No time entries yet</p>
              <p className="text-sm mt-1">Add your first entry above</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billable</th>
                  {isDraftOrRejected && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry) => {
                  const project = projects.find(p => p.id === entry.projectId);
                  return (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{project?.projectName || entry.projectId}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{entry.taskDescription}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.hours}h</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.billable ? (
                          <span className="text-green-600">✓ Billable</span>
                        ) : (
                          <span className="text-gray-400">Non-billable</span>
                        )}
                      </td>
                      {isDraftOrRejected && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => handleRemoveEntry(entry.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary & Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium mb-1">Total Hours</p>
              <p className="text-2xl font-bold text-blue-900">{totalHours.toFixed(1)}h</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium mb-1">Billable Hours</p>
              <p className="text-2xl font-bold text-green-900">{billableHours.toFixed(1)}h</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium mb-1">Non-Billable Hours</p>
              <p className="text-2xl font-bold text-purple-900">{(totalHours - billableHours).toFixed(1)}h</p>
            </div>
          </div>

          {isDraftOrRejected && (
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleSave}
                disabled={saving || entries.length === 0}
                className="flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </button>

              <button
                onClick={handleSubmit}
                disabled={saving || entries.length === 0}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit for Approval
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TimesheetEntry;
