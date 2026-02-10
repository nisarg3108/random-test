import React, { useState, useEffect } from 'react';
import { Calendar, FileText, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { apiClient } from '../../api/http';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';

const MyTimesheets = () => {
  const navigate = useNavigate();
  const [timesheets, setTimesheets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    fetchMyTimesheets();
    fetchSummary();
  }, []);

  const fetchMyTimesheets = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/timesheets/my');
      // Sort by week start date descending
      const sorted = response.data.sort((a, b) => 
        new Date(b.weekStartDate) - new Date(a.weekStartDate)
      );
      setTimesheets(sorted);
    } catch (err) {
      setError('Failed to load timesheets');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await apiClient.get('/timesheets/my/summary');
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to load summary', err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', icon: Clock, text: 'Draft' },
      SUBMITTED: { color: 'bg-blue-100 text-blue-800', icon: FileText, text: 'Submitted' },
      APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Approved' },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' },
    };
    const badge = badges[status] || badges.DRAFT;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const formatDateRange = (weekStart) => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getTotalHours = (timesheet) => {
    return timesheet.entries?.reduce((sum, entry) => sum + entry.hours, 0) || 0;
  };

  const filteredTimesheets = selectedStatus === 'ALL' 
    ? timesheets 
    : timesheets.filter(t => t.status === selectedStatus);

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Timesheets</h1>
          <p className="text-gray-600">View and manage your submitted timesheets</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Timesheets</p>
                  <p className="text-2xl font-bold text-blue-900">{summary.totalTimesheets}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Approved</p>
                  <p className="text-2xl font-bold text-green-900">{summary.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">{summary.submitted}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Hours</p>
                  <p className="text-2xl font-bold text-purple-900">{summary.totalHours?.toFixed(1) || 0}h</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">×</button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            {['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'].map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Timesheets List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredTimesheets.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p>No timesheets found</p>
              <p className="text-sm mt-1">
                {selectedStatus === 'ALL' 
                  ? 'Start by creating your first timesheet' 
                  : `No ${selectedStatus.toLowerCase()} timesheets`}
              </p>
              <button
                onClick={() => navigate('/projects/timesheet/entry')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Timesheet
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved/Rejected
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTimesheets.map((timesheet) => (
                  <tr key={timesheet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDateRange(timesheet.weekStartDate)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Week {new Date(timesheet.weekStartDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(timesheet.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {getTotalHours(timesheet).toFixed(1)}h
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {timesheet.submittedAt 
                        ? new Date(timesheet.submittedAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {timesheet.approvedAt && new Date(timesheet.approvedAt).toLocaleDateString()}
                      {timesheet.rejectedAt && new Date(timesheet.rejectedAt).toLocaleDateString()}
                      {!timesheet.approvedAt && !timesheet.rejectedAt && '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          // Navigate to timesheet entry page with the week
                          navigate('/projects/timesheet/entry', { 
                            state: { weekStartDate: timesheet.weekStartDate }
                          });
                        }}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create New Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => navigate('/projects/timesheet/entry')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Create New Timesheet
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default MyTimesheets;
