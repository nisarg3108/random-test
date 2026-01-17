import React, { useEffect } from 'react';
import { useFinanceStore } from '../../store/finance.store.js';
import { DollarSign, TrendingUp, FileText, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

const FinanceDashboard = () => {
  const { dashboardData, loading, error, fetchDashboardData } = useFinanceStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  const stats = dashboardData || {
    totalExpenseClaims: 0,
    pendingClaims: 0,
    totalAmount: 0,
    categoriesCount: 0
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
        <p className="text-gray-600">Overview of financial activities and expense management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Claims</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalExpenseClaims}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Claims</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingClaims}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalAmount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{stats.categoriesCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/finance/expense-claims'}
            className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Manage Claims</h3>
            <p className="text-sm text-gray-600">View and create expense claims</p>
          </button>

          <button
            onClick={() => window.location.href = '/finance/expense-categories'}
            className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">Categories</h3>
            <p className="text-sm text-gray-600">Manage expense categories</p>
          </button>

          <button
            onClick={() => window.location.href = '/workflows/approvals'}
            className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <AlertCircle className="h-8 w-8 text-yellow-600 mb-2" />
            <h3 className="font-medium text-gray-900">Approvals</h3>
            <p className="text-sm text-gray-600">Review pending approvals</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;