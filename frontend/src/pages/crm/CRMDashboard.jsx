import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { 
  Users, Target, TrendingUp, DollarSign, Activity,
  PhoneCall, Mail, Calendar, BarChart3
} from 'lucide-react';
import { apiClient } from '../../api/http';

const CRMDashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalLeads: 0,
    totalDeals: 0,
    totalRevenue: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch customers
      const customersRes = await apiClient.get('/crm/customers');
      // Fetch leads
      const leadsRes = await apiClient.get('/crm/leads');
      // Fetch deals
      const dealsRes = await apiClient.get('/crm/deals');

      setStats({
        totalCustomers: customersRes.data.data?.length || 0,
        totalLeads: leadsRes.data.data?.length || 0,
        totalDeals: dealsRes.data.data?.length || 0,
        totalRevenue: dealsRes.data.data?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0,
        recentActivities: []
      });
    } catch (error) {
      console.error('Error fetching CRM dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'blue',
      link: '/crm/customers'
    },
    {
      title: 'Active Leads',
      value: stats.totalLeads,
      icon: Target,
      color: 'green',
      link: '/crm/leads'
    },
    {
      title: 'Total Deals',
      value: stats.totalDeals,
      icon: TrendingUp,
      color: 'purple',
      link: '/crm/pipeline'
    },
    {
      title: 'Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'orange',
      link: '/crm/pipeline'
    }
  ];

  const quickActions = [
    { label: 'Add Customer', link: '/crm/customers', icon: Users, color: 'blue' },
    { label: 'Add Lead', link: '/crm/leads', icon: Target, color: 'green' },
    { label: 'View Pipeline', link: '/crm/pipeline', icon: Activity, color: 'purple' },
    { label: 'Communications', link: '/crm/communications', icon: PhoneCall, color: 'orange' }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">CRM Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your customer relationships and sales pipeline</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link
                key={index}
                to={card.link}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-2">{card.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full bg-${card.color}-100 flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${card.color}-600`} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.link}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg bg-${action.color}-50 hover:bg-${action.color}-100 transition-colors`}
                >
                  <Icon className={`w-8 h-8 text-${action.color}-600 mb-2`} />
                  <span className="text-sm font-medium text-gray-700">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/crm/customers"
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <Users className="w-8 h-8 mb-2" />
            <h3 className="text-xl font-bold mb-2">Customers</h3>
            <p className="text-sm opacity-90">Manage customer information and relationships</p>
          </Link>

          <Link
            to="/crm/leads"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <Target className="w-8 h-8 mb-2" />
            <h3 className="text-xl font-bold mb-2">Leads</h3>
            <p className="text-sm opacity-90">Track and convert potential customers</p>
          </Link>

          <Link
            to="/crm/pipeline"
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <Activity className="w-8 h-8 mb-2" />
            <h3 className="text-xl font-bold mb-2">Sales Pipeline</h3>
            <p className="text-sm opacity-90">Monitor deals and sales progress</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default CRMDashboard;
