import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../store/finance.store.js';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  DollarSign, TrendingUp, TrendingDown, FileText, AlertCircle, CheckCircle, 
  Clock, Wallet, Receipt, PiggyBank, CreditCard, ArrowUpRight, ArrowDownRight,
  Calendar, Users, Building2, RefreshCw
} from 'lucide-react';
import Layout from '../../components/layout/Layout.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const { dashboardData, loading, error, fetchDashboardData, expenseClaims, fetchExpenseClaims, expenseCategories, fetchExpenseCategories } = useFinanceStore();
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    fetchDashboardData();
    fetchExpenseClaims();
    fetchExpenseCategories();
  }, [fetchDashboardData, fetchExpenseClaims, fetchExpenseCategories]);

  // Calculate additional metrics from expense claims
  const calculateMetrics = () => {
    const claims = expenseClaims || [];
    const categories = expenseCategories || [];
    
    const pendingClaims = claims.filter(c => c.status === 'PENDING');
    const approvedClaims = claims.filter(c => c.status === 'APPROVED');
    const rejectedClaims = claims.filter(c => c.status === 'REJECTED');
    const paidClaims = claims.filter(c => c.status === 'PAID');
    
    const totalPending = pendingClaims.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalApproved = approvedClaims.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalPaid = paidClaims.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalRejected = rejectedClaims.reduce((sum, c) => sum + (c.amount || 0), 0);

    // Monthly expense trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const monthClaims = claims.filter(c => {
        const claimDate = new Date(c.expenseDate || c.createdAt);
        return claimDate.getMonth() === date.getMonth() && 
               claimDate.getFullYear() === date.getFullYear();
      });
      const monthTotal = monthClaims.reduce((sum, c) => sum + (c.amount || 0), 0);
      monthlyTrend.push({ month: monthName, amount: monthTotal, claims: monthClaims.length });
    }

    // Category breakdown
    const categoryBreakdown = categories.map(cat => {
      const catClaims = claims.filter(c => c.categoryId === cat.id || c.category?.id === cat.id);
      const total = catClaims.reduce((sum, c) => sum + (c.amount || 0), 0);
      return { name: cat.name, value: total, count: catClaims.length };
    }).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

    // Status distribution for pie chart
    const statusData = [
      { name: 'Pending', value: pendingClaims.length, color: '#F59E0B' },
      { name: 'Approved', value: approvedClaims.length, color: '#10B981' },
      { name: 'Rejected', value: rejectedClaims.length, color: '#EF4444' },
      { name: 'Paid', value: paidClaims.length, color: '#3B82F6' }
    ].filter(s => s.value > 0);

    // Recent claims
    const recentClaims = [...claims].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ).slice(0, 5);

    return {
      totalPending,
      totalApproved,
      totalPaid,
      totalRejected,
      pendingCount: pendingClaims.length,
      approvedCount: approvedClaims.length,
      paidCount: paidClaims.length,
      rejectedCount: rejectedClaims.length,
      monthlyTrend,
      categoryBreakdown,
      statusData,
      recentClaims
    };
  };

  const metrics = calculateMetrics();

  if (loading && !dashboardData) return (
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
    totalExpenseClaims: expenseClaims?.length || 0,
    pendingClaims: metrics.pendingCount,
    totalAmount: metrics.totalPending + metrics.totalApproved + metrics.totalPaid,
    categoriesCount: expenseCategories?.length || 0
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
              <Wallet className="w-7 h-7 text-blue-600" />
              Finance Dashboard
            </h1>
            <p className="text-primary-600 mt-1">Overview of financial activities and expense management</p>
          </div>
          <button
            onClick={() => { fetchDashboardData(); fetchExpenseClaims(); }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="modern-card-elevated p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <ArrowUpRight className="w-3 h-3" />
                <span>All time</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Claims</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalExpenseClaims}</p>
            </div>
          </div>

          <div className="modern-card-elevated p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              {metrics.pendingCount > 0 && (
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Pending Review</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.pendingCount}</p>
              <p className="text-xs text-gray-500 mt-2">${metrics.totalPending.toLocaleString()}</p>
            </div>
          </div>

          <div className="modern-card-elevated p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3" />
                <span>{metrics.approvedCount}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Approved</p>
              <p className="text-3xl font-bold text-gray-900">${metrics.totalApproved.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">{metrics.approvedCount} claims</p>
            </div>
          </div>

          <div className="modern-card-elevated p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                <CreditCard className="w-3 h-3" />
                <span>{metrics.paidCount}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Paid Out</p>
              <p className="text-3xl font-bold text-gray-900">${metrics.totalPaid.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">{metrics.paidCount} reimbursed</p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Expense Trend */}
          <div className="modern-card-elevated p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Monthly Expense Trend
            </h3>
            {metrics.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={metrics.monthlyTrend}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    fill="url(#colorAmount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No expense data available
              </div>
            )}
          </div>

          {/* Claims Status Distribution */}
          <div className="modern-card-elevated p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-purple-600" />
              Claims Status Distribution
            </h3>
            {metrics.statusData.length > 0 ? (
              <div className="flex items-center">
                <ResponsiveContainer width="60%" height={220}>
                  <PieChart>
                    <Pie
                      data={metrics.statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {metrics.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Claims']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {metrics.statusData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600">{item.name}</span>
                      <span className="text-sm font-semibold text-gray-900 ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No claims data available
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown & Recent Claims */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="modern-card-elevated p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-green-600" />
              Expenses by Category
            </h3>
            {metrics.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={metrics.categoryBreakdown.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Total']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {metrics.categoryBreakdown.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No category data available
              </div>
            )}
          </div>

          {/* Recent Claims */}
          <div className="modern-card-elevated p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              Recent Expense Claims
            </h3>
            {metrics.recentClaims.length > 0 ? (
              <div className="space-y-3">
                {metrics.recentClaims.map((claim, idx) => (
                  <div key={claim.id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        claim.status === 'PENDING' ? 'bg-yellow-100' :
                        claim.status === 'APPROVED' ? 'bg-green-100' :
                        claim.status === 'PAID' ? 'bg-blue-100' : 'bg-red-100'
                      }`}>
                        <DollarSign className={`w-4 h-4 ${
                          claim.status === 'PENDING' ? 'text-yellow-600' :
                          claim.status === 'APPROVED' ? 'text-green-600' :
                          claim.status === 'PAID' ? 'text-blue-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{claim.title || 'Expense Claim'}</p>
                        <p className="text-xs text-gray-500">{new Date(claim.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">${(claim.amount || 0).toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        claim.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        claim.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        claim.status === 'PAID' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>{claim.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No recent claims
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="modern-card-elevated p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/finance/expense-claims')}
              className="p-4 text-left border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors interactive-lift group"
            >
              <FileText className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-primary-900">Manage Claims</h3>
              <p className="text-sm text-primary-600">View and create expense claims</p>
            </button>

            <button
              onClick={() => navigate('/finance/expense-categories')}
              className="p-4 text-left border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors interactive-lift group"
            >
              <TrendingUp className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-primary-900">Categories</h3>
              <p className="text-sm text-primary-600">Manage expense categories</p>
            </button>

            <button
              onClick={() => navigate('/finance/approvals')}
              className="p-4 text-left border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors interactive-lift group relative"
            >
              <CheckCircle className="w-8 h-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-primary-900">Finance Approvals</h3>
              <p className="text-sm text-primary-600">Review pending expense claims</p>
              {metrics.pendingCount > 0 && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {metrics.pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/reports/financial/profit-loss')}
              className="p-4 text-left border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors interactive-lift group"
            >
              <Wallet className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-primary-900">Financial Reports</h3>
              <p className="text-sm text-primary-600">View P&L and balance sheets</p>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FinanceDashboard;