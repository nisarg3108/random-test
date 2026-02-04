import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../store/finance.store.js';
import { DollarSign, TrendingUp, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import Layout from '../../components/layout/Layout.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const { dashboardData, loading, error, fetchDashboardData } = useFinanceStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) return (
    <Layout>
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    </Layout>
  );
  
  if (error) return (
    <Layout>
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Error: {error}
      </div>
    </Layout>
  );

  const stats = dashboardData || {
    totalExpenseClaims: 0,
    pendingClaims: 0,
    totalAmount: 0,
    categoriesCount: 0
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Finance Dashboard</h1>
          <p className="text-primary-600 mt-1">Overview of financial activities and expense management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Total Claims</p>
                <p className="text-xl font-bold text-primary-900 mt-1">{stats.totalExpenseClaims}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Pending Claims</p>
                <p className="text-xl font-bold text-primary-900 mt-1">{stats.pendingClaims}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-50">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Total Amount</p>
                <p className="text-xl font-bold text-primary-900 mt-1">${stats.totalAmount}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Categories</p>
                <p className="text-xl font-bold text-primary-900 mt-1">{stats.categoriesCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="modern-card-elevated p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/finance/expense-claims')}
              className="p-4 text-left border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors interactive-lift"
            >
              <FileText className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-medium text-primary-900">Manage Claims</h3>
              <p className="text-sm text-primary-600">View and create expense claims</p>
            </button>

            <button
              onClick={() => navigate('/finance/expense-categories')}
              className="p-4 text-left border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors interactive-lift"
            >
              <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="font-medium text-primary-900">Categories</h3>
              <p className="text-sm text-primary-600">Manage expense categories</p>
            </button>

            <button
              onClick={() => navigate('/finance/approvals')}
              className="p-4 text-left border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors interactive-lift"
            >
              <CheckCircle className="w-8 h-8 text-orange-600 mb-2" />
              <h3 className="font-medium text-primary-900">Finance Approvals</h3>
              <p className="text-sm text-primary-600">Review pending expense claims</p>
            </button>

            <button
              onClick={() => navigate('/approvals')}
              className="p-4 text-left border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors interactive-lift"
            >
              <AlertCircle className="w-8 h-8 text-yellow-600 mb-2" />
              <h3 className="font-medium text-primary-900">All Approvals</h3>
              <p className="text-sm text-primary-600">View all pending approvals</p>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FinanceDashboard;