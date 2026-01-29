import React, { useState, useEffect } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { useApprovalsStore } from '../store/approvals.store';
import { getUserRole } from '../store/auth.store';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

const ApprovalDashboardSimple = () => {
  const {
    approvals,
    myRequests,
    loading,
    error,
    fetchApprovals,
    fetchMyRequests,
    approveRequest,
    rejectRequest,
    clearError
  } = useApprovalsStore();

  const [activeTab, setActiveTab] = useState('pending');
  const userRole = getUserRole();
  const canApprove = ['ADMIN', 'MANAGER'].includes(userRole);

  useEffect(() => {
    if (canApprove) {
      fetchApprovals();
    }
    fetchMyRequests();
  }, []);

  if (loading && approvals.length === 0 && myRequests.length === 0) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Approval Center</h1>
            <p className="text-gray-600">Manage approvals and track request status</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
              <span>{error}</span>
              <button onClick={clearError} className="text-red-500 hover:text-red-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {canApprove && (
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'pending'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Pending Approvals ({approvals.length})
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('my-requests')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'my-requests'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  My Requests ({myRequests.length})
                </button>
              </nav>
            </div>
          </div>

          {activeTab === 'pending' && canApprove ? (
            <div className="space-y-4">
              {approvals.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
                  <p className="mt-1 text-sm text-gray-500">All requests have been processed.</p>
                </div>
              ) : (
                approvals.map((approval) => (
                  <div key={approval.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {approval.workflow?.module} - {approval.workflow?.action}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Status: {approval.status}
                        </p>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(approval.createdAt).toLocaleString()}
                        </p>
                      </div>
                      
                      {approval.status === 'PENDING' && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => approveRequest(approval.id, '')}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                          
                          <button
                            onClick={() => {
                              const reason = prompt('Rejection reason (optional):');
                              if (reason !== null) {
                                rejectRequest(approval.id, reason);
                              }
                            }}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
                  <p className="mt-1 text-sm text-gray-500">You haven't submitted any requests yet.</p>
                </div>
              ) : (
                myRequests.map((request) => (
                  <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-medium text-gray-900">
                      {request.module} - {request.action}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Status: {request.status}
                    </p>
                    <p className="text-sm text-gray-500">
                      Submitted: {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalDashboardSimple;