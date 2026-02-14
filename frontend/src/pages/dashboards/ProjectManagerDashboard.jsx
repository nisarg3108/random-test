import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, Users, CheckCircle, Clock,
  AlertTriangle, TrendingUp, Calendar, Target
} from 'lucide-react';
import { apiClient } from '../../api/http';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExpenseClaimsWidget from '../../components/dashboard/ExpenseClaimsWidget';
import LeaveRequestWidget from '../../components/dashboard/LeaveRequestWidget';

const ProjectManagerDashboard = () => {
  const [stats, setStats] = useState({
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    teamMembers: 0,
    onTrackProjects: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Mock project data
      setStats({
        activeProjects: 8,
        totalTasks: 45,
        completedTasks: 28,
        overdueTasks: 3,
        teamMembers: 12,
        onTrackProjects: 6
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
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: Briefcase,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
      link: '/projects'
    },
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: CheckCircle,
      bg: 'bg-purple-50',
      color: 'text-purple-600',
      link: '/tasks'
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      icon: CheckCircle,
      bg: 'bg-green-50',
      color: 'text-green-600',
      link: '/tasks'
    },
    {
      title: 'Overdue Tasks',
      value: stats.overdueTasks,
      icon: AlertTriangle,
      bg: 'bg-red-50',
      color: 'text-red-600',
      link: '/tasks'
    },
    {
      title: 'Team Members',
      value: stats.teamMembers,
      icon: Users,
      bg: 'bg-teal-50',
      color: 'text-teal-600',
      link: '/employees'
    },
    {
      title: 'On Track',
      value: stats.onTrackProjects,
      icon: Target,
      bg: 'bg-indigo-50',
      color: 'text-indigo-600',
      link: '/projects'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor projects and team progress</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/projects/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Briefcase className="h-4 w-4" />
            New Project
          </Link>
          <Link
            to="/tasks/new"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            New Task
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <Briefcase className="h-5 w-5 text-blue-600" />
            Active Projects
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Website Redesign</p>
                <p className="text-xs text-gray-500">Due: Dec 31, 2024</p>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">On Track</span>
            </div>
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Mobile App Development</p>
                <p className="text-xs text-gray-500">Due: Jan 15, 2025</p>
              </div>
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">At Risk</span>
            </div>
            <div className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">ERP Integration</p>
                <p className="text-xs text-gray-500">Due: Feb 1, 2025</p>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">On Track</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/projects"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Briefcase className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Projects</p>
            </Link>
            <Link
              to="/tasks"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Tasks</p>
            </Link>
            <Link
              to="/employees"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Team</p>
            </Link>
            <Link
              to="/calendar"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Calendar className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Calendar</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectManagerDashboard;
