import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, ShoppingBag, Target, Phone,
  Mail, Calendar, CheckCircle
} from 'lucide-react';
import { apiClient } from '../../api/http';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExpenseClaimsWidget from '../../components/dashboard/ExpenseClaimsWidget';
import LeaveRequestWidget from '../../components/dashboard/LeaveRequestWidget';

const SalesStaffDashboard = () => {
  const [stats, setStats] = useState({
    myLeads: 0,
    activeDeals: 0,
    closedDeals: 0,
    todayFollowups: 0
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
        myLeads: 15,
        activeDeals: 8,
        closedDeals: 5,
        todayFollowups: 6
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
      title: 'My Leads',
      value: stats.myLeads,
      icon: Users,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
      link: '/crm/leads'
    },
    {
      title: 'Active Deals',
      value: stats.activeDeals,
      icon: Target,
      bg: 'bg-orange-50',
      color: 'text-orange-600',
      link: '/crm/pipeline'
    },
    {
      title: 'Closed Deals',
      value: stats.closedDeals,
      icon: CheckCircle,
      bg: 'bg-green-50',
      color: 'text-green-600',
      link: '/sales'
    },
    {
      title: 'Today Followups',
      value: stats.todayFollowups,
      icon: Calendar,
      bg: 'bg-purple-50',
      color: 'text-purple-600',
      link: '/crm/activities'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Staff Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your leads and sales activities</p>
        </div>
        <Link
          to="/crm/leads/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Add Lead
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
            to="/crm/leads"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">My Leads</p>
          </Link>
          <Link
            to="/crm/customers"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Customers</p>
          </Link>
          <Link
            to="/sales"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <ShoppingBag className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Sales Orders</p>
          </Link>
          <Link
            to="/crm/activities"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <Calendar className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Activities</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SalesStaffDashboard;
