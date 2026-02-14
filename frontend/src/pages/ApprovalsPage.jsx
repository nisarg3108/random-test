import React, { useEffect, useState } from 'react';
import { Check, X, Clock, AlertCircle, Plus } from 'lucide-react';
import { useApprovalsStore } from '../store/approvals.store';
import Layout from '../components/layout/Layout';

const ApprovalsPage = ({ filterModule = null }) => {
  const {
    approvals,
    loading,
    error,
    fetchApprovals,
    approveRequest,
    rejectRequest,
    clearError,
    createTestWorkflow
  } = useApprovalsStore();
  
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // Filter approvals by module if specified
  const filteredApprovals = filterModule 
    ? approvals.filter(approval => approval.workflow.module === filterModule)
    : approvals;

  const handleApprove = async (approvalId) => {
    setProcessing(approvalId);
    const success = await approveRequest(approvalId);
    if (!success) {
      alert('Failed to approve request');
    }
    setProcessing(null);
  };

  const handleReject = async (approvalId) => {
    const reason = prompt('Rejection reason (optional):');
    if (reason === null) return;
    
    setProcessing(approvalId);
    const success = await rejectRequest(approvalId, reason);
    if (!success) {
      alert('Failed to reject request');
    }
    setProcessing(null);
  };

  const handleCreateTest = async () => {
    const result = await createTestWorkflow();
    if (result) {
      alert('Test workflow created successfully!');
    }
  };

  const formatActionData = (data) => {
    if (!data) return 'No data';
    
    const { action, data: actionData, itemId } = data;
    
    switch (action) {
      case 'CREATE':
        return `Create: ${actionData?.name} (${actionData?.sku})`;
      case 'UPDATE':
        return `Update Item: ${itemId}`;
      case 'DELETE':
        return `Delete Item: ${itemId}`;
      default:
        return `${action} operation`;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-600">Review and approve pending requests</p>
        </div>
        <button
          onClick={handleCreateTest}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Test Workflow
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
          <button
            onClick={clearError}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {filteredApprovals.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
          <p className="mt-1 text-sm text-gray-500">All requests have been processed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApprovals.map((approval) => (
            <div key={approval.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <span className="font-medium text-gray-900">
                      {approval.workflow.module} - {approval.workflow.action}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Step {approval.workflowStep.stepOrder}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {formatActionData(approval.data)}
                  </p>
                  
                  <p className="text-xs text-gray-500">
                    Requested: {new Date(approval.createdAt).toLocaleString()}
                  </p>
                  
                  <p className="text-xs text-gray-500">
                    Permission required: {approval.permission}
                  </p>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleApprove(approval.id)}
                    disabled={processing === approval.id}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </button>
                  
                  <button
                    onClick={() => handleReject(approval.id)}
                    disabled={processing === approval.id}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default ApprovalsPage;