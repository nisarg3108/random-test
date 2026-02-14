import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Calendar, Clock, FileText,
  UserCheck, TrendingUp, Award
} from 'lucide-react';
import { apiClient } from '../../api/http';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExpenseClaimsWidget from '../../components/dashboard/ExpenseClaimsWidget';
import LeaveRequestWidget from '../../components/dashboard/LeaveRequestWidget';

const HRStaffDashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    todayAttendance: 0,
    myTasks: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [employeesRes, leavesRes] = await Promise.allSettled([
        apiClient.get('/employees'),
        apiClient.get('/leaves')
      ]);

      const employees = employeesRes.status === 'fulfilled' ? employeesRes.value.data : [];
      const leaves = leavesRes.status === 'fulfilled' ? leavesRes.value.data : [];

      setStats({
        totalEmployees: employees.length || 0,
        activeEmployees: employees.filter(e => e.status === 'ACTIVE').length || 0,
        pendingLeaves: leaves.filter(l => l.status === 'PENDING').length || 0,
        todayAttendance: employees.filter(e => e.status === 'ACTIVE').length || 0,
        myTasks: 8
      });

      setRecentActivities([
        { id: 1, type: 'Employee', description: 'Employee record updated', time: '1 hour ago' },
        { id: 2, type: 'Leave', description: 'Leave application processed', time: '3 hours ago' },
        { id: 3, type: 'Document', description: 'Employee document uploaded', time: '5 hours ago' }
      ]);
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
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
      link: '/employees'
    },
    {
      title: 'Active Employees',
      value: stats.activeEmployees,
      icon: UserCheck,
      bg: 'bg-green-50',
      color: 'text-green-600',
      link: '/employees'
    },
    {
      title: 'Pending Leaves',
      value: stats.pendingLeaves,
      icon: Calendar,
      bg: 'bg-orange-50',
      color: 'text-orange-600',
      link: '/leaves'
    },
    {
      title: 'My Tasks',
      value: stats.myTasks,
      icon: FileText,
      bg: 'bg-purple-50',
      color: 'text-purple-600',
      link: '/tasks'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HR Staff Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage employee records and HR tasks</p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Recent Activities
          </h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/employees"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Employees</p>
            </Link>
            <Link
              to="/leaves"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Calendar className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Leaves</p>
            </Link>
            <Link
              to="/attendance"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <UserCheck className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Attendance</p>
            </Link>
            <Link
              to="/documents"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <FileText className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Documents</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRStaffDashboard;
