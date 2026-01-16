import React, { useState, useEffect } from 'react';
import { Check, X, Clock, AlertCircle } from 'lucide-react';

const ApprovalsPage = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/approvals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setApprovals(data);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId) => {
    setProcessing(approvalId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        await fetchApprovals();
      }
    } catch (error) {
      console.error('Error approving:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (approvalId, reason) => {
    setProcessing(approvalId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        await fetchApprovals();
      }
    } catch (error) {
      console.error('Error rejecting:', error);
    } finally {
      setProcessing(null);
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-600">Review and approve pending requests</p>
      </div>

      {approvals.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
          <p className="mt-1 text-sm text-gray-500">All requests have been processed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
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
                    onClick={() => {
                      const reason = prompt('Rejection reason (optional):');
                      if (reason !== null) {
                        handleReject(approval.id, reason);
                      }
                    }}
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
    </div>
  );
};

export default ApprovalsPage;