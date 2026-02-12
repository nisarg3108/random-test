import React, { useEffect, useState } from 'react';
import { Check, X, Clock, DollarSign, Calendar, FileText, User, AlertCircle, Settings } from 'lucide-react';
import Layout from '../../components/layout/Layout.jsx';
import { apiClient } from '../../api/http.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

const FinanceApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [showSetup, setShowSetup] = useState(false);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all pending approvals
      const response = await apiClient.get('/approvals');
      
      // Filter for finance-related approvals
      const financeApprovals = response.data.filter(
        approval => approval.workflow?.module === 'FINANCE' && 
                   approval.workflow?.action === 'EXPENSE_CLAIM'
      );
      
      // If no approvals found, check if workflow exists
      if (financeApprovals.length === 0) {
        const debugResponse = await apiClient.get('/approvals/debug');
        const hasFinanceWorkflow = debugResponse.data.workflows?.some(
          w => w.module === 'FINANCE' && w.action === 'EXPENSE_CLAIM'
        );
        setShowSetup(!hasFinanceWorkflow);
      }
      
      // Fetch detailed expense claim data for each approval
      const approvalsWithDetails = await Promise.all(
        financeApprovals.map(async (approval) => {
          try {
            const expenseClaimId = approval.data?.payload?.expenseClaimId || 
                                  approval.workflow?.payload?.expenseClaimId;
            
            if (expenseClaimId) {
              // Fetch the expense claim details
              const claims = await apiClient.get('/finance/expense-claims');
              const claim = claims.data.find(c => c.id === expenseClaimId);
              
              return {
                ...approval,
                expenseClaim: claim
              };
            }
            return approval;
          } catch (err) {
            console.error('Failed to fetch expense claim details:', err);
            return approval;
          }
        })
      );
      
      setApprovals(approvalsWithDetails);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
      setError(err.response?.data?.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleSetupWorkflow = async () => {
    try {
      setProcessing('setup');
      setError(null);
      
      await apiClient.post('/approvals/seed-workflows');
      
      alert('Workflow setup completed! You can now approve expense claims.');
      setShowSetup(false);
      await fetchApprovals();
    } catch (err) {
      console.error('Failed to setup workflow:', err);
      setError(err.response?.data?.message || 'Failed to setup workflow');
    } finally {
      setProcessing(null);
    }
  };

  const handleApprove = async (approvalId) => {
    if (!window.confirm('Are you sure you want to approve this expense claim?')) {
      return;
    }

    try {
      setProcessing(approvalId);
      setError(null);
      
      await apiClient.post(`/approvals/${approvalId}/approve`, {
        comment: 'Approved by finance manager'
      });
      
      // Refresh the list
      await fetchApprovals();
      
      alert('Expense claim approved successfully!');
    } catch (err) {
      console.error('Failed to approve:', err);
      setError(err.response?.data?.message || 'Failed to approve expense claim');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (approvalId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason || reason.trim() === '') {
      alert('Rejection reason is required');
      return;
    }

    try {
      setProcessing(approvalId);
      setError(null);
      
      await apiClient.post(`/approvals/${approvalId}/reject`, {
        reason: reason.trim()
      });
      
      // Refresh the list
      await fetchApprovals();
      
      alert('Expense claim rejected');
    } catch (err) {
      console.error('Failed to reject:', err);
      setError(err.response?.data?.message || 'Failed to reject expense claim');
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Finance Approvals</h1>
          <p className="text-primary-600 mt-1">Review and approve pending expense claims</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Setup Notice */}
        {showSetup && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Setup Required: Expense Approval Workflow
                </h3>
                <p className="text-blue-700 mb-4">
                  The expense claim approval workflow needs to be initialized for your organization. 
                  This is a one-time setup that enables the approval process for expense claims.
                </p>
                <button
                  onClick={handleSetupWorkflow}
                  disabled={processing === 'setup'}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {processing === 'setup' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Initialize Workflow
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approvals List */}
        {approvals.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Pending Approvals</h3>
            <p className="mt-2 text-gray-500">All expense claims have been processed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => {
              const claim = approval.expenseClaim;
              
              return (
                <div 
                  key={approval.id} 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-6">
                    {/* Left Section - Claim Details */}
                    <div className="flex-1 space-y-4">
                      {/* Header with Status Badge */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                          <DollarSign className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {claim?.title || 'Expense Claim'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              Pending Approval - Step {approval.workflowStep?.stepOrder || 1}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Claim Information Grid */}
                      {claim && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <div>
                              <span className="text-gray-500">Amount:</span>
                              <span className="ml-2 font-semibold text-gray-900">
                                {formatCurrency(claim.amount)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <span className="text-gray-500">Expense Date:</span>
                              <span className="ml-2 text-gray-900">
                                {formatDate(claim.expenseDate)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <div>
                              <span className="text-gray-500">Category:</span>
                              <span className="ml-2 text-gray-900">
                                {claim.category?.name || 'N/A'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <span className="text-gray-500">Submitted by:</span>
                              <span className="ml-2 text-gray-900">
                                {claim.employee?.name || claim.employee?.email || 'Employee'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {claim?.description && (
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-sm text-gray-500 font-medium mb-1">Description:</p>
                          <p className="text-sm text-gray-700">{claim.description}</p>
                        </div>
                      )}

                      {/* Receipt URL */}
                      {claim?.receiptUrl && (
                        <div className="pt-2">
                          <a
                            href={claim.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 underline"
                          >
                            View Receipt
                          </a>
                        </div>
                      )}

                      {/* Submission Info */}
                      <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <p>Submitted: {formatDate(approval.createdAt)}</p>
                        {approval.permission && (
                          <p className="mt-1">Required Permission: {approval.permission}</p>
                        )}
                      </div>
                    </div>

                    {/* Right Section - Action Buttons */}
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => handleApprove(approval.id)}
                        disabled={processing === approval.id}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[120px]"
                      >
                        {processing === approval.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleReject(approval.id)}
                        disabled={processing === approval.id}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[120px]"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FinanceApprovals;
