import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, DollarSign, TrendingUp, Target,
  ShoppingBag, Award, BarChart3, UserPlus
} from 'lucide-react';
import { apiClient } from '../../api/http';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ApprovalWidget from '../../components/approvals/ApprovalWidget';
import ExpenseClaimsWidget from '../../components/dashboard/ExpenseClaimsWidget';
import LeaveRequestWidget from '../../components/dashboard/LeaveRequestWidget';

const SalesManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    activePipeline: 0,
    wonDeals: 0,
    teamPerformance: 0,
    monthlyRevenue: 0,
    customerCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Mock sales data
      setStats({
        totalSales: 125,
        activePipeline: 45,
        wonDeals: 32,
        teamPerformance: 88,
        monthlyRevenue: 450000,
        customerCount: 87
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
      title: 'Total Sales',
      value: stats.totalSales,
      icon: ShoppingBag,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
      change: '+15%',
      link: '/sales'
    },
    {
      title: 'Active Pipeline',
      value: stats.activePipeline,
      icon: Target,
      bg: 'bg-orange-50',
      color: 'text-orange-600',
      link: '/crm/pipeline'
    },
    {
      title: 'Won Deals',
      value: stats.wonDeals,
      icon: Award,
      bg: 'bg-green-50',
      color: 'text-green-600',
      link: '/sales'
    },
    {
      title: 'Team Performance',
      value: `${stats.teamPerformance}%`,
      icon: TrendingUp,
      bg: 'bg-purple-50',
      color: 'text-purple-600',
      link: '/reports'
    },
    {
      title: 'Monthly Revenue',
      value: `$${(stats.monthlyRevenue / 1000).toFixed(0)}K`,
      icon: DollarSign,
      bg: 'bg-teal-50',
      color: 'text-teal-600',
      change: '+22%',
      link: '/reports'
    },
    {
      title: 'Total Customers',
      value: stats.customerCount,
      icon: Users,
      bg: 'bg-indigo-50',
      color: 'text-indigo-600',
      link: '/crm/customers'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor sales performance and team metrics</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/crm/customers/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Customer
          </Link>
          <Link
            to="/sales/new"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <ShoppingBag className="h-4 w-4" />
            New Sale
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
                  <span className="text-sm font-medium text-green-600">{card.change}</span>
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
            <Target className="h-5 w-5 text-blue-600" />
            Sales Pipeline
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Lead</span>
              <span className="text-sm font-bold text-blue-600">15</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Qualified</span>
              <span className="text-sm font-bold text-orange-600">12</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Proposal</span>
              <span className="text-sm font-bold text-purple-600">10</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Negotiation</span>
              <span className="text-sm font-bold text-green-600">8</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/crm/customers"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Customers</p>
            </Link>
            <Link
              to="/crm/pipeline"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Pipeline</p>
            </Link>
            <Link
              to="/sales"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <ShoppingBag className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Sales Orders</p>
            </Link>
            <Link
              to="/reports"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <BarChart3 className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Reports</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesManagerDashboard;
