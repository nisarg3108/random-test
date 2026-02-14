import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, Calendar, Clock, CheckCircle,
  FileText, DollarSign, Award, Bell
} from 'lucide-react';
import { apiClient } from '../../api/http';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExpenseClaimsWidget from '../../components/dashboard/ExpenseClaimsWidget';
import LeaveRequestWidget from '../../components/dashboard/LeaveRequestWidget';

const EmployeeDashboard = () => {
  const [stats, setStats] = useState({
    leaveBalance: 0,
    myTasks: 0,
    attendance: 0,
    upcomingLeaves: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Mock employee data
      setStats({
        leaveBalance: 15,
        myTasks: 8,
        attendance: 96,
        upcomingLeaves: 2
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
      title: 'Leave Balance',
      value: `${stats.leaveBalance} days`,
      icon: Calendar,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
      link: '/leaves'
    },
    {
      title: 'My Tasks',
      value: stats.myTasks,
      icon: CheckCircle,
      bg: 'bg-purple-50',
      color: 'text-purple-600',
      link: '/tasks'
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendance}%`,
      icon: Clock,
      bg: 'bg-green-50',
      color: 'text-green-600',
      link: '/attendance'
    },
    {
      title: 'Upcoming Leaves',
      value: stats.upcomingLeaves,
      icon: Calendar,
      bg: 'bg-orange-50',
      color: 'text-orange-600',
      link: '/leaves'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
          <p className="text-gray-600 mt-1">Your personal workspace</p>
        </div>
        <Link
          to="/leaves/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Apply Leave
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Recent Notifications
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Leave approved</p>
                <p className="text-xs text-gray-500 mt-1">Your leave request for Dec 25-26 has been approved</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <FileText className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Payslip available</p>
                <p className="text-xs text-gray-500 mt-1">Your November payslip is now available</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Task assigned</p>
                <p className="text-xs text-gray-500 mt-1">New task assigned: Update project documentation</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/leaves"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">My Leaves</p>
            </Link>
            <Link
              to="/attendance"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Attendance</p>
            </Link>
            <Link
              to="/tasks"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <CheckCircle className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">My Tasks</p>
            </Link>
            <Link
              to="/payroll"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <DollarSign className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Payslips</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Expense Claims and Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseClaimsWidget maxItems={5} />
        <LeaveRequestWidget maxItems={5} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Employee ID</p>
              <p className="text-base font-semibold text-gray-900">EMP-001</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Join Date</p>
              <p className="text-base font-semibold text-gray-900">Jan 1, 2024</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 p-3 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="text-base font-semibold text-gray-900">Engineering</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
