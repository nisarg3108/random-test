import React, { useState, useEffect } from 'react';
import { 
  Check, X, Clock, AlertCircle, Eye, Filter, 
  ChevronDown, User, Calendar, FileText 
} from 'lucide-react';
import { useApprovalsStore } from '../store/approvals.store';
import { getUserRole, getUserFromToken } from '../store/auth.store';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

const ApprovalDashboard = () => {
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
  const [filterModule, setFilterModule] = useState('ALL');
  const [processing, setProcessing] = useState(null);
  const [selectedApproval, setSelectedApproval] = useState(null);

  const userRole = getUserRole();
  const currentUser = getUserFromToken();
  const canApprove = ['ADMIN', 'MANAGER'].includes(userRole);

  useEffect(() => {
    if (canApprove) {
      fetchApprovals();
    }
    fetchMyRequests();
  }, []);

  const handleApprove = async (approvalId, comment) => {
    setProcessing(approvalId);
    const success = await approveRequest(approvalId, comment);
    if (success) {
      setSelectedApproval(null);
    }
    setProcessing(null);
  };

  const handleReject = async (approvalId, reason) => {
    setProcessing(approvalId);
    const success = await rejectRequest(approvalId, reason);
    if (success) {
      setSelectedApproval(null);
    }
    setProcessing(null);
  };

  const formatActionData = (data) => {
    if (!data) return 'No data';
    
    const { action, data: actionData, itemId } = data;
    
    switch (action) {
      case 'CREATE':
        return `Create: ${actionData?.name || actionData?.title || 'New Item'}`;
      case 'UPDATE':
        return `Update: ${actionData?.name || `Item ${itemId}`}`;
      case 'DELETE':
        return `Delete: ${actionData?.name || `Item ${itemId}`}`;
      default:
        return `${action} operation`;
    }
  };

  const getModuleIcon = (module) => {
    const icons = {
      INVENTORY: '📦',
      HR: '👥',
      FINANCE: '💰',
      GENERAL: '📋'
    };
    return icons[module] || '📋';
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status}
      </span>
    );
  };

  const filteredApprovals = approvals.filter(approval => 
    filterModule === 'ALL' || approval.workflow?.module === filterModule
  );

  const modules = [...new Set(approvals.map(a => a.workflow?.module))].filter(Boolean);

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
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Approval Center</h1>
            <p className="text-gray-600">Manage approvals and track request status</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
              <span>{error}</span>
              <button onClick={clearError} className="text-red-500 hover:text-red-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Tabs */}
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
                    Pending Approvals ({filteredApprovals.length})
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

          {/* Filters */}
          {activeTab === 'pending' && canApprove && (
            <div className="mb-6 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Modules</option>
                  {modules.map(module => (
                    <option key={module} value={module}>{module}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Content */}
          {activeTab === 'pending' && canApprove ? (
            <div className="space-y-4">
              {filteredApprovals.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
                  <p className="mt-1 text-sm text-gray-500">All requests have been processed.</p>
                </div>
              ) : (
                filteredApprovals.map((approval) => (
                  <div key={approval.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-2xl">{getModuleIcon(approval.workflow?.module)}</span>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {approval.workflow?.module} - {approval.workflow?.action}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Step {approval.workflowStep?.stepOrder} of {approval.workflow?.steps?.length || 'N/A'}
                            </p>
                          </div>
                          {getStatusBadge(approval.status)}
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-700">
                            <strong>Action:</strong> {formatActionData(approval.data)}
                          </p>
                          <p className="text-sm text-gray-500">
                            <Calendar className="inline h-4 w-4 mr-1" />
                            Requested: {new Date(approval.createdAt).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            <User className="inline h-4 w-4 mr-1" />
                            Permission: {approval.permission}
                          </p>
                        </div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => setSelectedApproval(approval)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </button>
                        
                        {approval.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(approval.id, '')}
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
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // My Requests Tab
            <div className="space-y-4">
              {myRequests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
                  <p className="mt-1 text-sm text-gray-500">You haven't submitted any requests yet.</p>
                </div>
              ) : (
                myRequests.map((request) => (
                  <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-2xl">{getModuleIcon(request.workflow?.module)}</span>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {request.workflow?.module} - {request.workflow?.action}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Request ID: {request.id}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm text-gray-700">
                            <strong>Action:</strong> {formatActionData(request.data)}
                          </p>
                          <p className="text-sm text-gray-500">
                            <Calendar className="inline h-4 w-4 mr-1" />
                            Submitted: {new Date(request.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Detail Modal */}
          {selectedApproval && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Approval Details</h2>
                    <button
                      onClick={() => setSelectedApproval(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Module & Action</label>
                      <p className="text-sm text-gray-900">
                        {selectedApproval.workflow?.module} - {selectedApproval.workflow?.action}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Request Details</label>
                      <p className="text-sm text-gray-900">{formatActionData(selectedApproval.data)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      {getStatusBadge(selectedApproval.status)}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Permission Required</label>
                      <p className="text-sm text-gray-900">{selectedApproval.permission}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Requested At</label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedApproval.createdAt).toLocaleString()}
                      </p>
                    </div>
                    
                    {selectedApproval.data && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Raw Data</label>
                        <pre className="text-xs bg-gray-100 p-3 rounded-md overflow-x-auto">
                          {JSON.stringify(selectedApproval.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  
                  {selectedApproval.status === 'PENDING' && canApprove && (
                    <div className="flex space-x-3 mt-6 pt-4 border-t">
                      <button
                        onClick={() => handleApprove(selectedApproval.id, '')}
                        disabled={processing === selectedApproval.id}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </button>
                      
                      <button
                        onClick={() => {
                          const reason = prompt('Rejection reason (optional):');
                          if (reason !== null) {
                            handleReject(selectedApproval.id, reason);
                          }
                        }}
                        disabled={processing === selectedApproval.id}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalDashboard;