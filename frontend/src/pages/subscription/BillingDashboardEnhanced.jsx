import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Filter,
  LayoutDashboard,
  RefreshCw,
  Settings,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react';
import Layout from '../../components/layout/Layout.jsx';
import { useBilling } from '../../hooks/useBilling.js';
import { RoleGuard } from '../../hooks/useAuth';
import { downloadInvoice, resendInvoiceEmail } from '../../api/billing.api.js';

const BillingDashboardEnhanced = () => {
  const {
    subscription,
    plans,
    payments,
    events,
    metrics,
    loading,
    error,
    actionLoading,
    refresh,
    cancelSubscription,
    changePlan,
  } = useBilling();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState('last30');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'payment-history', label: 'Payment History', icon: FileText },
    { id: 'invoices', label: 'Invoices & Receipts', icon: Download },
    { id: 'preferences', label: 'Billing Preferences', icon: Settings },
    { id: 'analytics', label: 'Cost Analytics', icon: TrendingUp },
  ];

  const paymentSummary = useMemo(() => {
    const succeeded = payments.filter((payment) => payment.status === 'SUCCEEDED').length;
    const failed = payments.filter((payment) => payment.status === 'FAILED').length;
    const pending = payments.filter((payment) => payment.status === 'PENDING').length;
    const totalAmount = payments
      .filter((p) => p.status === 'SUCCEEDED')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return { succeeded, failed, pending, totalAmount };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    let filtered = [...payments];
    
    // Filter by status
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(p => p.status === paymentFilter);
    }

    // Filter by date range
    const now = new Date();
    const ranges = {
      last7: 7,
      last30: 30,
      last90: 90,
      last365: 365,
    };

    if (dateRange !== 'all' && ranges[dateRange]) {
      const days = ranges[dateRange];
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(p => {
        const paymentDate = new Date(p.created || p.createdAt);
        return paymentDate >= cutoffDate;
      });
    }

    return filtered;
  }, [payments, paymentFilter, dateRange]);

  const handleCancel = async () => {
    const confirmed = window.confirm('Cancel this subscription at period end?');
    if (!confirmed) return;
    await cancelSubscription(true);
  };

  const handlePlanChange = async (event) => {
    event.preventDefault();
    await changePlan(selectedPlanId);
    setSelectedPlanId('');
  };

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || null;
  const availablePlans = useMemo(
    () => plans.filter((plan) => plan.id !== subscription?.plan?.id),
    [plans, subscription?.plan?.id]
  );

  const handleDownloadInvoice = async (paymentId) => {
    try {
      // Get the blob from the API
      const blob = await downloadInvoice(paymentId);
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${paymentId.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  };

  const handleResendInvoice = async (paymentId) => {
    try {
      const result = await resendInvoiceEmail(paymentId);
      if (result.success) {
        alert(result.message || 'Invoice email sent successfully!');
      } else {
        alert('Failed to send invoice: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      let errorMessage = 'Error sending invoice.';
      
      if (error.message) {
        if (error.message.includes('email')) {
          errorMessage = 'Unable to send email. Please check your email settings or contact support.';
        } else if (error.message.includes('not configured')) {
          errorMessage = 'Email service is not configured. Please contact administrator.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(errorMessage);
    }
  };

  const handleExportPayments = () => {
    // Export filtered payments as CSV
    const csv = [
      ['Date', 'Amount', 'Currency', 'Status', 'Invoice Number', 'Description'].join(','),
      ...filteredPayments.map(p => [
        new Date(p.created || p.createdAt).toISOString(),
        p.amount,
        p.currency,
        p.status,
        p.invoiceNumber || '',
        p.description || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <RoleGuard requiredRole="ADMIN">
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Wallet className="w-8 h-8 text-blue-600" />
                Billing & Payments
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your subscription, payments, and billing preferences
              </p>
            </div>

            <button
              type="button"
              onClick={refresh}
              disabled={loading || actionLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${
                        activeTab === tab.id
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Account Overview</h2>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-5">
                    <p className="text-sm text-blue-600 font-medium">Current Plan</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      {subscription?.plan?.name || 'No Plan'}
                    </p>
                    <p className="text-sm text-blue-600 mt-2">
                      {subscription?.plan?.currency} {subscription?.plan?.basePrice}/{subscription?.plan?.billingCycle}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-5">
                    <p className="text-sm text-green-600 font-medium">Status</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {subscription?.status || 'Unknown'}
                    </p>
                    <p className="text-sm text-green-600 mt-2">
                      {subscription?.billing?.daysRemaining} days remaining
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-5">
                    <p className="text-sm text-purple-600 font-medium">Total Paid</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                      {subscription?.plan?.currency || 'USD'} {paymentSummary.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-sm text-purple-600 mt-2">
                      {paymentSummary.succeeded} successful payments
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-5">
                    <p className="text-sm text-orange-600 font-medium">Next Billing</p>
                    <p className="text-xl font-bold text-orange-900 mt-1">
                      {subscription?.billing?.currentPeriodEnd 
                        ? new Date(subscription.billing.currentPeriodEnd).toLocaleDateString()
                        : 'N/A'}
                    </p>
                    <p className="text-sm text-orange-600 mt-2">
                      {subscription?.plan?.currency} {subscription?.plan?.basePrice}
                    </p>
                  </div>
                </div>

                {/* Subscription Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-blue-600" />
                      Subscription Details
                    </h3>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Billing Cycle:</span>
                        <span className="font-medium text-gray-900">
                          {subscription?.plan?.billingCycle || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Period Start:</span>
                        <span className="font-medium text-gray-900">
                          {subscription?.billing?.currentPeriodStart 
                            ? new Date(subscription.billing.currentPeriodStart).toLocaleDateString()
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Period End:</span>
                        <span className="font-medium text-gray-900">
                          {subscription?.billing?.currentPeriodEnd 
                            ? new Date(subscription.billing.currentPeriodEnd).toLocaleDateString()
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Provider:</span>
                        <span className="font-medium text-gray-900">
                          {subscription?.billing?.provider || 'Manual'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Auto Renew:</span>
                        <span className={`font-medium ${subscription?.billing?.autoRenew ? 'text-green-600' : 'text-gray-600'}`}>
                          {subscription?.billing?.autoRenew ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={actionLoading}
                      className="w-full bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 border border-red-200"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Subscription
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      Change Plan
                    </h3>

                    {availablePlans.length === 0 ? (
                      <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        No alternative plans available. You're on the only active plan.
                      </div>
                    ) : (
                      <form onSubmit={handlePlanChange} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select New Plan
                          </label>
                          <select
                            value={selectedPlanId}
                            onChange={(e) => setSelectedPlanId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
                          >
                            <option value="">Choose a plan...</option>
                            {availablePlans.map((plan) => (
                              <option key={plan.id} value={plan.id}>
                                {plan.name} - {plan.currency} {plan.basePrice}/{plan.billingCycle}
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedPlan && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="font-medium text-blue-900">{selectedPlan.name}</p>
                            <p className="text-sm text-blue-700 mt-1">
                              {selectedPlan.description || 'No description available'}
                            </p>
                            <p className="text-sm text-blue-700 mt-2">
                              Modules: {selectedPlan.moduleCount}
                            </p>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={actionLoading || !selectedPlanId}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          Change to {selectedPlan?.name || 'Selected'} Plan
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment History Tab */}
            {activeTab === 'payment-history' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
                  <button
                    onClick={handleExportPayments}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                {/* Filters */}
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="all">All Status</option>
                      <option value="SUCCEEDED">Succeeded</option>
                      <option value="FAILED">Failed</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="all">All Time</option>
                      <option value="last7">Last 7 Days</option>
                      <option value="last30">Last 30 Days</option>
                      <option value="last90">Last 90 Days</option>
                      <option value="last365">Last Year</option>
                    </select>
                  </div>
                </div>

                {/* Payment Table */}
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p>No payments found</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Invoice
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(payment.created || payment.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {payment.description || 'Subscription Payment'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {payment.currency} {payment.amount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  payment.status === 'SUCCEEDED'
                                    ? 'bg-green-100 text-green-800'
                                    : payment.status === 'FAILED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {payment.invoiceNumber || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {payment.status === 'SUCCEEDED' && (
                                <button
                                  onClick={() => handleDownloadInvoice(payment.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Invoices & Receipts</h2>
                </div>
                
                {payments.filter(p => p.status === 'SUCCEEDED').length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p>No invoices available</p>
                    <p className="text-sm mt-2">Invoices will appear here after successful payments</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.filter(p => p.status === 'SUCCEEDED').map((payment) => {
                      const invoiceNumber = payment.invoiceNumber || `INV-${payment.id.slice(0, 8).toUpperCase()}`;
                      const invoiceDate = new Date(payment.created || payment.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                      
                      return (
                        <div key={payment.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{invoiceNumber}</h3>
                                <p className="text-sm text-gray-600">{invoiceDate}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {payment.description || 'Subscription Payment'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right flex items-center gap-4">
                              <div>
                                <p className="text-lg font-bold text-gray-900">
                                  {payment.currency} {payment.amount}
                                </p>
                                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  {payment.status}
                                </span>
                              </div>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDownloadInvoice(payment.id)}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                                  title="Download PDF"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </button>
                                
                                <button
                                  onClick={() => handleResendInvoice(payment.id)}
                                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                                  title="Resend Email"
                                >
                                  <FileText className="w-4 h-4" />
                                  Email
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Billing Preferences</h2>

                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="font-medium text-gray-900 mb-4">Email Notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="ml-3 text-sm text-gray-700">Send invoice emails</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="ml-3 text-sm text-gray-700">Payment confirmation emails</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="ml-3 text-sm text-gray-700">Failed payment alerts</span>
                      </label>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="font-medium text-gray-900 mb-4">Billing Address</h3>
                    <p className="text-sm text-gray-600 mb-4">Update your billing address for invoices</p>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Update Address
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="font-medium text-gray-900 mb-4">Tax Information</h3>
                    <p className="text-sm text-gray-600 mb-4">Manage your tax ID and related information</p>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Update Tax Info
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Cost Analytics</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-5">
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {subscription?.plan?.currency || 'USD'} {subscription?.plan?.basePrice || 0}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-5">
                    <p className="text-sm text-gray-600">Year to Date</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {subscription?.plan?.currency || 'USD'} {paymentSummary.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-5">
                    <p className="text-sm text-gray-600">Avg. Monthly Cost</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {subscription?.plan?.currency || 'USD'} {subscription?.plan?.basePrice || 0}
                    </p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Cost Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Base Subscription</span>
                      <span className="font-medium text-gray-900">
                        {subscription?.plan?.currency || 'USD'} {subscription?.plan?.basePrice || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Additional Users</span>
                      <span className="font-medium text-gray-900">
                        {subscription?.plan?.currency || 'USD'} 0.00
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">
                        {subscription?.plan?.currency || 'USD'} {subscription?.plan?.basePrice || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </RoleGuard>
  );
};

export default BillingDashboardEnhanced;
