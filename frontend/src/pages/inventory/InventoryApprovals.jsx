import React, { useEffect, useState } from 'react';
import { Check, X, Clock, Package } from 'lucide-react';
import { useApprovalsStore } from '../../store/approvals.store';
import Layout from '../../components/layout/Layout';

const InventoryApprovals = () => {
  const { approvals, loading, fetchApprovals, approveRequest, rejectRequest } = useApprovalsStore();
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const inventoryApprovals = approvals.filter(
    approval => approval.workflow.module === 'INVENTORY'
  );

  const handleApprove = async (approvalId) => {
    setProcessing(approvalId);
    await approveRequest(approvalId);
    setProcessing(null);
  };

  const handleReject = async (approvalId) => {
    const reason = prompt('Rejection reason (optional):');
    if (reason === null) return;
    setProcessing(approvalId);
    await rejectRequest(approvalId, reason);
    setProcessing(null);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Approvals</h1>
        <p className="text-gray-600">Review and approve inventory requests</p>
      </div>

      {inventoryApprovals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
          <p className="mt-1 text-sm text-gray-500">All inventory requests have been processed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inventoryApprovals.map((approval) => (
            <div key={approval.id} className="bg-white border rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-gray-900">
                      {approval.workflow.action}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Step {approval.workflowStep.stepOrder}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {approval.data?.action === 'CREATE' && `Create: ${approval.data?.data?.name} (${approval.data?.data?.sku})`}
                    {approval.data?.action === 'UPDATE' && `Update Item: ${approval.data?.itemId}`}
                    {approval.data?.action === 'DELETE' && `Delete Item: ${approval.data?.itemId}`}
                  </p>
                  
                  <p className="text-xs text-gray-500">
                    Requested: {new Date(approval.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleApprove(approval.id)}
                    disabled={processing === approval.id}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </button>
                  
                  <button
                    onClick={() => handleReject(approval.id)}
                    disabled={processing === approval.id}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
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

export default InventoryApprovals;
