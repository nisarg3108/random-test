import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Clock, User, AlertCircle, Eye } from 'lucide-react';
import { apiClient } from '../../api/http';
import Layout from '../../components/layout/Layout';

const TimesheetApprovals = () => {
  const [pendingTimesheets, setPendingTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [timesheetDetails, setTimesheetDetails] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/timesheets/pending-approvals');
      setPendingTimesheets(response.data);
    } catch (err) {
      setError('Failed to load pending timesheets');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimesheetDetails = async (timesheetId) => {
    try {
      const response = await apiClient.get(`/timesheets/${timesheetId}`);
      setTimesheetDetails(response.data);
      setShowDetailModal(true);
    } catch (err) {
      setError('Failed to load timesheet details');
    }
  };

  const handleApprove = async (timesheetId) => {
    if (!window.confirm('Are you sure you want to approve this timesheet?')) return;

    try {
      setProcessing(true);
      setError('');
      await apiClient.post(`/timesheets/${timesheetId}/approve`);
      setSuccess('Timesheet approved successfully!');
      fetchPendingApprovals();
      setShowDetailModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve timesheet');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      setError('');
      await apiClient.post(`/timesheets/${selectedTimesheet.id}/reject`, {
        reason: rejectionReason
      });
      setSuccess('Timesheet rejected!');
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectionReason('');
      fetchPendingApprovals();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject timesheet');
    } finally {
      setProcessing(false);
    }
  };

  const openRejectModal = (timesheet) => {
    setSelectedTimesheet(timesheet);
    setShowRejectModal(true);
    setRejectionReason('');
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

  const getBillableHours = (timesheet) => {
    return timesheet.entries?.filter(e => e.billable).reduce((sum, entry) => sum + entry.hours, 0) || 0;
  };

  const getDaysSinceSubmission = (submittedAt) => {
    const submitted = new Date(submittedAt);
    const now = new Date();
    const diff = Math.floor((now - submitted) / (1000 * 60 * 60 * 24));
    return diff;
  };

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Timesheet Approvals</h1>
          <p className="text-gray-600">Review and approve employee timesheets</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending Approvals</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingTimesheets.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Hours</p>
                <p className="text-2xl font-bold text-blue-900">
                  {pendingTimesheets.reduce((sum, ts) => sum + getTotalHours(ts), 0).toFixed(1)}h
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Employees</p>
                <p className="text-2xl font-bold text-purple-900">
                  {new Set(pendingTimesheets.map(ts => ts.employeeId)).size}
                </p>
              </div>
              <User className="h-8 w-8 text-purple-600" />
            </div>
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

        {/* Pending Timesheets List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {pendingTimesheets.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p>No pending approvals</p>
              <p className="text-sm mt-1">All timesheets have been reviewed</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingTimesheets.map((timesheet) => {
                  const totalHours = getTotalHours(timesheet);
                  const billableHours = getBillableHours(timesheet);
                  const daysWaiting = getDaysSinceSubmission(timesheet.submittedAt);

                  return (
                    <tr key={timesheet.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Employee ID: {timesheet.employeeId}
                            </div>
                            {timesheet.employee?.name && (
                              <div className="text-xs text-gray-500">{timesheet.employee.name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDateRange(timesheet.weekStartDate)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {timesheet.entries?.length || 0} entries
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {totalHours.toFixed(1)}h total
                        </div>
                        <div className="text-xs text-green-600">
                          {billableHours.toFixed(1)}h billable
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(timesheet.submittedAt).toLocaleDateString()}
                        </div>
                        <div className={`text-xs ${daysWaiting > 3 ? 'text-red-600' : 'text-gray-500'}`}>
                          {daysWaiting === 0 ? 'Today' : `${daysWaiting} days ago`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => fetchTimesheetDetails(timesheet.id)}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleApprove(timesheet.id)}
                            disabled={processing}
                            className="text-green-600 hover:text-green-900 inline-flex items-center disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(timesheet)}
                            disabled={processing}
                            className="text-red-600 hover:text-red-900 inline-flex items-center disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Reject Modal */}
        {showRejectModal && selectedTimesheet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
                Reject Timesheet
              </h3>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Employee ID: <span className="font-medium">{selectedTimesheet.employeeId}</span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Week: <span className="font-medium">{formatDateRange(selectedTimesheet.weekStartDate)}</span>
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="4"
                  placeholder="Please provide a clear reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  disabled={processing}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {processing ? 'Rejecting...' : 'Reject Timesheet'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && timesheetDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Timesheet Details</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Week: {formatDateRange(timesheetDetails.weekStartDate)}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium mb-1">Total Hours</p>
                  <p className="text-xl font-bold text-blue-900">{getTotalHours(timesheetDetails).toFixed(1)}h</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-600 font-medium mb-1">Billable</p>
                  <p className="text-xl font-bold text-green-900">{getBillableHours(timesheetDetails).toFixed(1)}h</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-xs text-purple-600 font-medium mb-1">Entries</p>
                  <p className="text-xl font-bold text-purple-900">{timesheetDetails.entries?.length || 0}</p>
                </div>
              </div>

              {/* Entries */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Time Entries</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Billable</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {timesheetDetails.entries?.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {entry.project?.projectName || entry.projectId}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">
                            {entry.taskDescription}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{entry.hours}h</td>
                          <td className="px-4 py-2 text-sm">
                            {entry.billable ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openRejectModal(timesheetDetails);
                  }}
                  disabled={processing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(timesheetDetails.id)}
                  disabled={processing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TimesheetApprovals;
