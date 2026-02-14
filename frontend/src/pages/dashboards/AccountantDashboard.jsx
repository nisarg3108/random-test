import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Receipt, DollarSign, TrendingUp,
  Calculator, BookOpen, PieChart, FileCheck
} from 'lucide-react';
import { apiClient } from '../../api/http';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExpenseClaimsWidget from '../../components/dashboard/ExpenseClaimsWidget';
import LeaveRequestWidget from '../../components/dashboard/LeaveRequestWidget';

const AccountantDashboard = () => {
  const [stats, setStats] = useState({
    pendingEntries: 0,
    todayEntries: 0,
    accountsUnbalanced: 0,
    recentTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Mock data
      setStats({
        pendingEntries: 5,
        todayEntries: 12,
        accountsUnbalanced: 2,
        recentTransactions: 45
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
      title: 'Pending Entries',
      value: stats.pendingEntries,
      icon: FileText,
      bg: 'bg-orange-50',
      color: 'text-orange-600',
      link: '/accounting/journal'
    },
    {
      title: "Today's Entries",
      value: stats.todayEntries,
      icon: FileCheck,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
      link: '/accounting/journal'
    },
    {
      title: 'Accounts Unbalanced',
      value: stats.accountsUnbalanced,
      icon: Calculator,
      bg: 'bg-red-50',
      color: 'text-red-600',
      link: '/accounting/ledger'
    },
    {
      title: 'Recent Transactions',
      value: stats.recentTransactions,
      icon: Receipt,
      bg: 'bg-green-50',
      color: 'text-green-600',
      link: '/accounting/ledger'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accountant Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage accounts and transactions</p>
        </div>
        <Link
          to="/accounting/journal/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          New Journal Entry
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Link key={card.title} to={card.link} className="block">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.bg} p-3 rounded-lg`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Expense Claims and Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseClaimsWidget maxItems={5} />
        <LeaveRequestWidget maxItems={5} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/accounting/journal"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Journal Entries</p>
          </Link>
          <Link
            to="/accounting/ledger"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <BookOpen className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">General Ledger</p>
          </Link>
          <Link
            to="/accounting/charts"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <Calculator className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Chart of Accounts</p>
          </Link>
          <Link
            to="/accounting/reports"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <PieChart className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Reports</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;
