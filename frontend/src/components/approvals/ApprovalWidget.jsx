import React, { useState, useEffect } from 'react';
import { Clock, Check, X, AlertCircle, ChevronRight } from 'lucide-react';
import { useApprovalsStore } from '../../store/approvals.store';
import { getUserRole } from '../../store/auth.store';
import { useNavigate } from 'react-router-dom';

const ApprovalWidget = ({ maxItems = 5, showActions = true }) => {
  const navigate = useNavigate();
  const {
    approvals,
    myRequests,
    loading,
    fetchApprovals,
    fetchMyRequests,
    approveRequest,
    rejectRequest
  } = useApprovalsStore();

  const [processing, setProcessing] = useState(null);
  const userRole = getUserRole();
  const canApprove = ['ADMIN', 'MANAGER'].includes(userRole);

  useEffect(() => {
    if (canApprove) {
      fetchApprovals();
    }
    fetchMyRequests();
  }, []);

  const handleQuickApprove = async (approvalId) => {
    setProcessing(approvalId);
    await approveRequest(approvalId, 'Quick approval from dashboard');
    setProcessing(null);
  };

  const handleQuickReject = async (approvalId) => {
    setProcessing(approvalId);
    await rejectRequest(approvalId, 'Quick rejection from dashboard');
    setProcessing(null);
  };

  const formatActionData = (data) => {
    if (!data) return 'No data';
    const { action, data: actionData } = data;
    
    switch (action) {
      case 'CREATE':
        return `Create: ${actionData?.name || 'New Item'}`;
      case 'UPDATE':
        return `Update: ${actionData?.name || 'Item'}`;
      case 'DELETE':
        return `Delete: ${actionData?.name || 'Item'}`;
      default:
        return `${action} operation`;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'text-yellow-600 bg-yellow-50',
      APPROVED: 'text-green-600 bg-green-50',
      REJECTED: 'text-red-600 bg-red-50',
      COMPLETED: 'text-blue-600 bg-blue-50'
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  if (loading && approvals.length === 0 && myRequests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const displayItems = canApprove ? approvals : myRequests;
  const limitedItems = displayItems.slice(0, maxItems);

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              {canApprove ? 'Pending Approvals' : 'My Requests'}
            </h3>
          </div>
          <button
            onClick={() => navigate('/approval-dashboard')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
          >
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {limitedItems.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">
              {canApprove ? 'No pending approvals' : 'No requests submitted'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {limitedItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {item.workflow?.module || 'General'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1 truncate">
                      {formatActionData(item.data)}
                    </p>
                    
                    <p className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {canApprove && item.status === 'PENDING' && showActions && (
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => handleQuickApprove(item.id)}
                        disabled={processing === item.id}
                        className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                        title="Quick Approve"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleQuickReject(item.id)}
                        disabled={processing === item.id}
                        className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        title="Quick Reject"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {displayItems.length > maxItems && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => navigate('/approval-dashboard')}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View {displayItems.length - maxItems} more items
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalWidget;