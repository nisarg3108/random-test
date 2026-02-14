import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, TrendingUp, TrendingDown, Receipt,
  CreditCard, FileText, PieChart, AlertCircle
} from 'lucide-react';
import { apiClient } from '../../api/http';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ApprovalWidget from '../../components/approvals/ApprovalWidget';
import ExpenseClaimsWidget from '../../components/dashboard/ExpenseClaimsWidget';
import LeaveRequestWidget from '../../components/dashboard/LeaveRequestWidget';

const FinanceManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingInvoices: 0,
    pendingApprovals: 0,
    cashflow: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Mock data for finance
      setStats({
        totalRevenue: 850000,
        totalExpenses: 420000,
        netProfit: 430000,
        pendingInvoices: 12,
        pendingApprovals: 8,
        cashflow: 215000
      });
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${(stats.totalRevenue / 1000).toFixed(0)}K`,
      icon: TrendingUp,
      bg: 'bg-green-50',
      color: 'text-green-600',
      change: '+12.5%',
      link: '/accounting/ledger'
    },
    {
      title: 'Total Expenses',
      value: `$${(stats.totalExpenses / 1000).toFixed(0)}K`,
      icon: TrendingDown,
      bg: 'bg-red-50',
      color: 'text-red-600',
      change: '-3.2%',
      link: '/accounting/ledger'
    },
    {
      title: 'Net Profit',
      value: `$${(stats.netProfit / 1000).toFixed(0)}K`,
      icon: DollarSign,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
      change: '+18.3%',
      link: '/accounting/reports'
    },
    {
      title: 'Pending Invoices',
      value: stats.pendingInvoices,
      icon: Receipt,
      bg: 'bg-orange-50',
      color: 'text-orange-600',
      link: '/invoices'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: AlertCircle,
      bg: 'bg-purple-50',
      color: 'text-purple-600',
      link: '/approvals'
    },
    {
      title: 'Cashflow',
      value: `$${(stats.cashflow / 1000).toFixed(0)}K`,
      icon: CreditCard,
      bg: 'bg-teal-50',
      color: 'text-teal-600',
      link: '/accounting/reports'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor financial performance and approvals</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/accounting/journal"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            New Entry
          </Link>
          <Link
            to="/accounting/reports"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <PieChart className="h-4 w-4" />
            Reports
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <Link key={card.title} to={card.link} className="block">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.bg} p-3 rounded-lg`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                {card.change && (
                  <span className={`text-sm font-medium ${card.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {card.change}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Expense Claims and Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseClaimsWidget maxItems={5} />
        <LeaveRequestWidget maxItems={5} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Pending Approvals
          </h2>
          <ApprovalWidget userRole="FINANCE_MANAGER" />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/accounting/ledger"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Ledger</p>
            </Link>
            <Link
              to="/accounting/journal"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <FileText className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Journal</p>
            </Link>
            <Link
              to="/accounting/reports"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <PieChart className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Reports</p>
            </Link>
            <Link
              to="/invoices"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Receipt className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Invoices</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceManagerDashboard;
