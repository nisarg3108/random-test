import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInventoryStore } from '../../store/inventory.store';
import { useDepartmentsStore } from '../../store/departments.store';
import { dashboardAPI } from '../../api/dashboard.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ApprovalWidget from '../../components/approvals/ApprovalWidget';
import OverdueAllocationWidget from '../../components/assets/OverdueAllocationWidget';
import ExpenseClaimsWidget from '../../components/dashboard/ExpenseClaimsWidget';
import LeaveRequestWidget from '../../components/dashboard/LeaveRequestWidget';
import { Package, Building2, Clock, Zap, BarChart3, CheckCircle, Activity, TrendingUp, Sparkles, ArrowUpRight, Target } from 'lucide-react';

const ManagerDashboard = () => {
  const { items, loading: itemsLoading, fetchItems } = useInventoryStore();
  const { departments, loading: deptsLoading, fetchDepartments } = useDepartmentsStore();
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    fetchItems();
    fetchDepartments();
    loadActivities();
  }, [fetchItems, fetchDepartments]);

  const loadActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await dashboardAPI.getRecentActivities();
      setActivities(response.data.slice(0, 3)); // Show only 3 recent activities
    } catch (error) {
      console.error('Failed to load activities:', error);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

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

  const loading = itemsLoading || deptsLoading || activitiesLoading;
  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Modern Manager Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Manager Dashboard</h1>
              <p className="text-purple-100 text-lg">Manage operations and oversee departments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 rounded-2xl bg-blue-50 group-hover:scale-110 transition-transform duration-300">
                <Package className="w-7 h-7 text-blue-600" />
              </div>
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                <TrendingUp className="w-3 h-3" />
                <span>+8%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Items</p>
              <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{items.length}</p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 rounded-2xl bg-emerald-50 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                <CheckCircle className="w-3 h-3" />
                <span>Active</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Departments</p>
              <p className="text-3xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors duration-300">{departments.length}</p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 rounded-2xl bg-purple-50 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-7 h-7 text-purple-600" />
              </div>
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                <Clock className="w-3 h-3" />
                <span>Pending</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pending Approvals</p>
              <p className="text-3xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">0</p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 rounded-2xl bg-amber-50 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-7 h-7 text-amber-600" />
              </div>
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                <Activity className="w-3 h-3" />
                <span>Running</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Active Workflows</p>
              <p className="text-3xl font-bold text-gray-900 group-hover:text-amber-600 transition-colors duration-300">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Manager Actions */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manager Actions</h2>
            <p className="text-gray-500 text-sm">Essential management tools</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Link to="/departments" className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <Building2 className="w-7 h-7 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">Manage Departments</span>
            </div>
          </Link>
          <Link to="/workflows" className="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <Zap className="w-7 h-7 text-amber-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900 group-hover:text-amber-600 transition-colors duration-300">Workflows</span>
            </div>
          </Link>
          <Link to="/approvals" className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors duration-300">Approvals</span>
            </div>
          </Link>
          <Link to="/reports" className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <BarChart3 className="w-7 h-7 text-purple-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">Reports</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Expense Claims and Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ExpenseClaimsWidget maxItems={5} />
        <LeaveRequestWidget maxItems={5} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Approval Widget */}
        <div className="lg:col-span-1">
          <ApprovalWidget maxItems={5} showActions={true} />
        </div>

        {/* Overdue Allocation Widget */}
        <div className="lg:col-span-1">
          <OverdueAllocationWidget maxItems={5} showDetails={true} />
        </div>

        {/* Enhanced Departments */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Departments</h2>
                  <p className="text-gray-500 text-sm">Organizational structure</p>
                </div>
              </div>
              <Link to="/departments" className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 font-semibold text-sm rounded-xl transition-all duration-200 hover:scale-105">
                <span>View All</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            {departments.length > 0 ? (
              <div className="space-y-4">
                {departments.slice(0, 5).map((dept) => (
                  <div key={dept.id} className="group flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all duration-200 border border-transparent hover:border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <Building2 className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">{dept.name}</p>
                        <p className="text-sm text-gray-500">ID: {dept.id}</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg">
                      Active
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No departments found</p>
                <p className="text-gray-400 text-sm mt-1">Create your first department to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Recent Activities */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm h-full">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
                <p className="text-gray-500 text-sm">Latest system events</p>
              </div>
            </div>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={activity.id} className="group flex items-center p-4 hover:bg-gray-50 rounded-2xl transition-all duration-200 border border-transparent hover:border-gray-100">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 mr-4">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 mb-1">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        by {activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System'} • {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
                    }`}></div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
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

export default ManagerDashboard;