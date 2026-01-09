import React, { useEffect, useState } from 'react';
import { workflowsAPI } from '../../api/workflows.api';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { RoleGuard } from '../../hooks/useAuth';

const ApprovalQueue = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await workflowsAPI.getApprovals();
      setApprovals(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'workflowId', label: 'Workflow ID' },
    { key: 'stepOrder', label: 'Step' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created' }
  ];

  const handleApprove = async (approval) => {
    try {
      await workflowsAPI.approveRequest(approval.id, { comment: 'Approved' });
      fetchApprovals();
    } catch (err) {
      setError(err.message || 'Failed to approve request');
    }
  };

  const handleReject = async (approval) => {
    try {
      await workflowsAPI.rejectRequest(approval.id, { comment: 'Rejected' });
      fetchApprovals();
    } catch (err) {
      setError(err.message || 'Failed to reject request');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

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
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Approval Queue</h1>
              <p className="text-gray-600 mt-1">Review and approve pending requests</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
              </div>
              <div className="p-6">
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {columns.map((col) => (
                            <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {col.label}
                            </th>
                          ))}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {approvals && approvals.length > 0 ? (
                          approvals.map((approval, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {approval.workflowId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {approval.stepOrder}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {getStatusBadge(approval.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(approval.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {approval.status === 'PENDING' && (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleApprove(approval)}
                                      className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleReject(approval)}
                                      className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-gray-500">
                              No pending approvals
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};

export default ApprovalQueue;