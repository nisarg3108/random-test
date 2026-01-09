import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Package, Building2, Activity, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Clock, BarChart3, Zap, Shield,
  Eye, ArrowUpRight, Sparkles, Target, Award
} from 'lucide-react';
import { apiClient } from '../../api/http';
import LoadingSpinner, { SkeletonLoader } from '../../components/common/LoadingSpinner';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animateCards, setAnimateCards] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // Trigger card animations after component mounts
    setTimeout(() => setAnimateCards(true), 100);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [usersRes, inventoryRes, departmentsRes] = await Promise.allSettled([
        apiClient.get('/users'),
        apiClient.get('/inventory'),
        apiClient.get('/departments')
      ]);

      const users = usersRes.status === 'fulfilled' ? usersRes.value.data : [];
      const inventory = inventoryRes.status === 'fulfilled' ? inventoryRes.value.data : [];
      const departments = departmentsRes.status === 'fulfilled' ? departmentsRes.value.data : [];

      setStats({
        users: users.length || 0,
        inventory: inventory.length || 0,
        departments: departments.length || 0,
        activeUsers: users.filter(u => u.status === 'ACTIVE').length || 0,
        adminCount: users.filter(u => u.role === 'ADMIN').length || 0,
        managerCount: users.filter(u => u.role === 'MANAGER').length || 0,
        userCount: users.filter(u => u.role === 'USER').length || 0
      });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="skeleton h-8 w-64"></div>
            <div className="skeleton h-4 w-96"></div>
          </div>
          <div className="skeleton h-10 w-32"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200">
              <SkeletonLoader lines={3} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      change: '+12%',
      changeType: 'positive',
      description: 'Active team members'
    },
    {
      title: 'Inventory Items',
      value: stats.inventory,
      icon: Package,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      change: '+8%',
      changeType: 'positive',
      description: 'Products in stock'
    },
    {
      title: 'Departments',
      value: stats.departments,
      icon: Building2,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      change: '+3%',
      changeType: 'positive',
      description: 'Active departments'
    },
    {
      title: 'System Health',
      value: '99.9%',
      icon: Activity,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50',
      change: '+0.1%',
      changeType: 'positive',
      description: 'Uptime this month'
    }
  ];

  const quickActions = [
    { 
      to: '/users', 
      label: 'Manage Users', 
      icon: Users, 
      gradient: 'from-indigo-600 to-purple-600',
      description: 'Add, edit, or remove users',
      count: stats.users
    },
    { 
      to: '/roles', 
      label: 'Roles & Permissions', 
      icon: Shield, 
      gradient: 'from-purple-600 to-pink-600',
      description: 'Configure access control',
      count: '3 roles'
    },
    { 
      to: '/company', 
      label: 'Company Settings', 
      icon: Building2, 
      gradient: 'from-orange-600 to-red-600',
      description: 'Organization configuration',
      count: 'Settings'
    },
    { 
      to: '/audit', 
      label: 'Audit Logs', 
      icon: Clock, 
      gradient: 'from-red-600 to-pink-600',
      description: 'Track system activities',
      count: 'Recent'
    }
  ];

  const recentActivities = [
    { 
      action: 'New user registered', 
      user: 'john.doe@company.com', 
      time: '5 minutes ago',
      type: 'user',
      icon: '👤'
    },
    { 
      action: 'Inventory item updated', 
      user: 'admin@company.com', 
      time: '15 minutes ago',
      type: 'inventory',
      icon: '📦'
    },
    { 
      action: 'Department created', 
      user: 'manager@company.com', 
      time: '1 hour ago',
      type: 'department',
      icon: '🏢'
    },
    { 
      action: 'User role changed', 
      user: 'admin@company.com', 
      time: '2 hours ago',
      type: 'security',
      icon: '🔐'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="animate-slide-right">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl animate-float">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient">
                Admin Dashboard
              </h1>
              <p className="text-slate-600 mt-2 flex items-center space-x-2 font-medium">
                <span>Complete system overview and administration</span>
                <Target className="w-5 h-5" />
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4 animate-slide-right" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-3 rounded-2xl border border-green-200 saas-shadow">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50 status-indicator"></div>
            <span className="text-sm font-bold text-green-700">System Online</span>
          </div>
          <button className="p-3 saas-card saas-shadow hover:saas-shadow-lg transition-all duration-200 hover:scale-105 rounded-2xl">
            <Eye className="w-6 h-6 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-4 flex items-center space-x-3 animate-slide-up">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-800">Error Loading Data</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.changeType === 'positive';
          return (
            <div 
              key={index} 
              className={`group saas-card p-8 hover:saas-shadow-xl transition-all duration-300 hover:-translate-y-2 card-hover ${
                animateCards ? 'animate-slide-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-3xl bg-gradient-to-br ${stat.bgGradient} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <Icon className={`w-8 h-8 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`} />
                </div>
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-bold ${
                  isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-2">{stat.title}</p>
                <p className="text-4xl font-bold text-slate-900 mb-3">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="saas-card p-8 animate-slide-up saas-shadow-lg" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Quick Actions</h2>
          </div>
          <div className="text-sm text-slate-500 font-medium">Frequently used features</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.to}
                className="group relative overflow-hidden saas-card p-8 hover:saas-shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-2"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-br ${action.gradient} rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-3 group-hover:text-primary-600 transition-colors text-lg">
                    {action.label}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">{action.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">{action.count}</span>
                    <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">User Breakdown</h2>
            </div>
            <Award className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {[
              { label: 'Active Users', value: stats.activeUsers, color: 'from-green-500 to-emerald-500', percentage: 85 },
              { label: 'Administrators', value: stats.adminCount, color: 'from-red-500 to-pink-500', percentage: 15 },
              { label: 'Managers', value: stats.managerCount, color: 'from-blue-500 to-indigo-500', percentage: 25 },
              { label: 'Regular Users', value: stats.userCount, color: 'from-slate-500 to-slate-600', percentage: 60 }
            ].map((item, index) => (
              <div key={index} className="group">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-700 font-medium text-sm">{item.label}</span>
                  <span className={`font-bold text-lg bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                    {item.value}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: animateCards ? `${item.percentage}%` : '0%' }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
            </div>
            <Link to="/audit" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center space-x-1 group">
              <span>View All</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="group flex items-center space-x-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{activity.action}</p>
                  <p className="text-sm text-slate-600">by {activity.user}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">{activity.time}</span>
                  <div className={`w-2 h-2 rounded-full mt-1 ml-auto ${
                    index < 2 ? 'bg-green-500 animate-pulse' : 'bg-slate-300'
                  }`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;