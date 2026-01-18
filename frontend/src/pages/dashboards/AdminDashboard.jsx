import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Package, Building2, Activity, TrendingUp, 
  AlertTriangle, CheckCircle, Clock, BarChart3, Zap, Shield,
  Eye, ArrowUpRight, Target, Award
} from 'lucide-react';
import { apiClient } from '../../api/http';
import { dashboardAPI } from '../../api/dashboard.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ApprovalWidget from '../../components/approvals/ApprovalWidget';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    inventory: 0,
    departments: 0,
    activeUsers: 0,
    adminCount: 0,
    managerCount: 0,
    userCount: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [usersRes, inventoryRes, departmentsRes, activitiesRes] = await Promise.allSettled([
        apiClient.get('/users'),
        apiClient.get('/inventory'),
        apiClient.get('/departments'),
        dashboardAPI.getRecentActivities()
      ]);

      const users = usersRes.status === 'fulfilled' ? usersRes.value.data : [];
      const inventory = inventoryRes.status === 'fulfilled' ? inventoryRes.value.data : [];
      const departments = departmentsRes.status === 'fulfilled' ? departmentsRes.value.data : [];
      const activitiesData = activitiesRes.status === 'fulfilled' ? activitiesRes.value.data : [];

      setStats({
        users: users.length || 0,
        inventory: inventory.length || 0,
        departments: departments.length || 0,
        activeUsers: users.filter(u => u.status === 'ACTIVE').length || 0,
        adminCount: users.filter(u => u.role === 'ADMIN').length || 0,
        managerCount: users.filter(u => u.role === 'MANAGER').length || 0,
        userCount: users.filter(u => u.role === 'USER').length || 0
      });

      setActivities(activitiesData.slice(0, 4)); // Show only 4 recent activities
    } catch (err) {
      setError('Failed to load dashboard data');
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
      title: 'Total Users',
      value: stats.users,
      icon: Users,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
      change: '+12%'
    },
    {
      title: 'Inventory Items',
      value: stats.inventory,
      icon: Package,
      bg: 'bg-emerald-50',
      color: 'text-emerald-600',
      change: '+8%'
    },
    {
      title: 'Departments',
      value: stats.departments,
      icon: Building2,
      bg: 'bg-purple-50',
      color: 'text-purple-600',
      change: '+3%'
    },
    {
      title: 'System Health',
      value: '99.9%',
      icon: Activity,
      bg: 'bg-emerald-50',
      color: 'text-emerald-600',
      change: '+0.1%'
    }
  ];

  const quickActions = [
    { 
      to: '/users', 
      label: 'Manage Users', 
      icon: Users, 
      bg: 'bg-blue-50',
      color: 'text-blue-600',
      count: stats.users
    },
    { 
      to: '/roles', 
      label: 'Roles & Permissions', 
      icon: Shield, 
      bg: 'bg-purple-50',
      color: 'text-purple-600',
      count: '3 roles'
    },
    { 
      to: '/company', 
      label: 'Company Settings', 
      icon: Building2, 
      bg: 'bg-orange-50',
      color: 'text-orange-600',
      count: 'Settings'
    },
    { 
      to: '/audit', 
      label: 'Audit Logs', 
      icon: Clock, 
      bg: 'bg-red-50',
      color: 'text-red-600',
      count: 'Recent'
    }
  ];

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Complete system overview and administration</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-sm font-medium text-emerald-700">System Online</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <h3 className="font-medium">Error Loading Data</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="modern-card-elevated p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  <TrendingUp className="w-3 h-3" />
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="modern-card-elevated p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.to}
                className="modern-card p-4 hover:modern-shadow-lg transition-all duration-200 hover:scale-105"
              >
                <div className={`w-12 h-12 ${action.bg} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{action.label}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{action.count}</span>
                  <ArrowUpRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Approval Widget */}
        <div className="lg:col-span-1">
          <ApprovalWidget maxItems={4} showActions={true} />
        </div>

        {/* User Breakdown */}
        <div className="lg:col-span-1">
          <div className="modern-card-elevated p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">User Breakdown</h2>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Active Users', value: stats.activeUsers, color: 'bg-emerald-500', percentage: 85 },
                { label: 'Administrators', value: stats.adminCount, color: 'bg-red-500', percentage: 15 },
                { label: 'Managers', value: stats.managerCount, color: 'bg-blue-500', percentage: 25 },
                { label: 'Regular Users', value: stats.userCount, color: 'bg-gray-500', percentage: 60 }
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium text-sm">{item.label}</span>
                    <span className="font-bold text-gray-900">{item.value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="modern-card-elevated p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <Link to="/audit" className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1">
                <span>View All</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{activity.description}</p>
                      <p className="text-sm text-gray-600">
                        by {activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                      <div className={`w-2 h-2 rounded-full mt-1 ml-auto ${
                        index < 2 ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No recent activities</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;