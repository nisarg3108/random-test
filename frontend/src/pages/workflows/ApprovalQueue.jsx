import React, { useEffect, useState } from 'react';
import { workflowsAPI } from '../../api/workflows.api';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { RoleGuard } from '../../hooks/useAuth';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  Calendar,
  MessageSquare,
  AlertCircle,
  Check,
  X,
  Filter,
  RefreshCw
} from 'lucide-react';

const ApprovalQueue = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('PENDING');
  
  // Modal state for approve/reject actions
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // View details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsApproval, setDetailsApproval] = useState(null);

  useEffect(() => {
    fetchApprovals();
  }, [filter]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchApprovals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await workflowsAPI.getApprovals({ status: filter !== 'ALL' ? filter : undefined });
      setApprovals(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (approval, type) => {
    setSelectedApproval(approval);
    setActionType(type);
    setComment('');
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedApproval(null);
    setActionType(null);
    setComment('');
  };

  const handleAction = async () => {
    if (!selectedApproval || !actionType) return;
    
    // Validate comment for rejection
    if (actionType === 'reject' && !comment.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      if (actionType === 'approve') {
        await workflowsAPI.approveRequest(selectedApproval.id, { 
          comment: comment.trim() || 'Approved' 
        });
        setSuccess('Request approved successfully');
      } else {
        await workflowsAPI.rejectRequest(selectedApproval.id, { 
          reason: comment.trim() 
        });
        setSuccess('Request rejected');
      }
      closeActionModal();
      fetchApprovals();
    } catch (err) {
      setError(err.message || `Failed to ${actionType} request`);
    } finally {
      setActionLoading(false);
    }
  };

  const viewDetails = (approval) => {
    setDetailsApproval(approval);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status) => {
    const config = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'APPROVED': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'REJECTED': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const { color, icon: Icon } = config[status] || { color: 'bg-gray-100 text-gray-800', icon: Clock };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const pendingCount = approvals.filter(a => a.status === 'PENDING').length;

  return (
    <RoleGuard requiredRole="MANAGER" fallback={
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    }>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <FileText className="w-8 h-8 text-indigo-600" />
                  Approval Queue
                </h1>
                <p className="text-gray-600 mt-1">Review and approve pending requests</p>
              </div>
              <div className="flex items-center gap-3">
                {pendingCount > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    {pendingCount} pending
                  </span>
                )}
                <button
                  onClick={fetchApprovals}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {success}
              </div>
            )}

            {/* Filter Tabs */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Filter by status:</span>
                </div>
                <div className="flex gap-2">
                  {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === status
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {loading ? (
                  <LoadingSpinner />
                ) : approvals.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No approvals found</h3>
                    <p className="text-gray-500">
                      {filter === 'PENDING' 
                        ? 'All caught up! No pending approvals at the moment.' 
                        : `No ${filter.toLowerCase()} requests found.`}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Request Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Requester
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Step
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {approvals.map((approval) => (
                          <tr key={approval.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {approval.workflow?.module || 'Unknown'} - {approval.workflow?.action || 'Action'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ID: {approval.workflowId?.substring(0, 8)}...
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <User className="w-4 h-4 text-indigo-600" />
                                </div>
                                <span className="text-sm text-gray-700">
                                  {approval.request?.requester?.name || 'Unknown'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              Step {approval.stepOrder || 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(approval.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Calendar className="w-4 h-4" />
                                {new Date(approval.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => viewDetails(approval)}
                                  className="text-indigo-600 hover:text-indigo-800 p-2 rounded-lg hover:bg-indigo-50"
                                  title="View details"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                {approval.status === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() => openActionModal(approval, 'approve')}
                                      className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-sm font-medium"
                                    >
                                      <Check className="w-4 h-4" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => openActionModal(approval, 'reject')}
                                      className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 text-sm font-medium"
                                    >
                                      <X className="w-4 h-4" />
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Action Modal (Approve/Reject with Comment) */}
            <Modal
              isOpen={showActionModal}
              onClose={closeActionModal}
              title={actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
            >
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  actionType === 'approve' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <p className={`text-sm ${
                    actionType === 'approve' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    You are about to <strong>{actionType}</strong> this request.
                    {selectedApproval && (
                      <span className="block mt-1 text-gray-600">
                        Module: {selectedApproval.workflow?.module} | Action: {selectedApproval.workflow?.action}
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4 inline-block mr-1" />
                    {actionType === 'approve' ? 'Comment (optional)' : 'Reason for rejection (required)'}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder={actionType === 'approve' 
                      ? 'Add any comments for the requester...' 
                      : 'Please provide a reason for rejecting this request...'
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                      actionType === 'reject' && !comment.trim()
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                  />
                  {actionType === 'reject' && !comment.trim() && (
                    <p className="text-xs text-red-500 mt-1">A reason is required for rejection</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={closeActionModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAction}
                    disabled={actionLoading || (actionType === 'reject' && !comment.trim())}
                    className={`px-6 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 ${
                      actionType === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {actionLoading ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
                  </button>
                </div>
              </div>
            </Modal>

            {/* Details Modal */}
            <Modal
              isOpen={showDetailsModal}
              onClose={() => { setShowDetailsModal(false); setDetailsApproval(null); }}
              title="Request Details"
            >
              {detailsApproval && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 uppercase">Module</p>
                      <p className="text-sm font-semibold text-gray-900">{detailsApproval.workflow?.module}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 uppercase">Action</p>
                      <p className="text-sm font-semibold text-gray-900">{detailsApproval.workflow?.action}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                      {getStatusBadge(detailsApproval.status)}
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 uppercase">Step</p>
                      <p className="text-sm font-semibold text-gray-900">Step {detailsApproval.stepOrder || 1}</p>
                    </div>
                  </div>

                  {detailsApproval.comment && (
                    <div className="border-t pt-4">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">Comment/Reason</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{detailsApproval.comment}</p>
                    </div>
                  )}

                  {detailsApproval.request?.data && (
                    <div className="border-t pt-4">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">Request Data</p>
                      <pre className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(detailsApproval.request.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t">
                    <button
                      onClick={() => { setShowDetailsModal(false); setDetailsApproval(null); }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </Modal>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};

export default ApprovalQueue;