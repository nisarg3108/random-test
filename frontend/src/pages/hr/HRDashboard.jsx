import React, { useEffect, useState } from 'react';
import { 
  Users, Calendar, Clock, CheckCircle, XCircle, 
  TrendingUp, Building, UserCheck, AlertTriangle 
} from 'lucide-react';
import { hrAPI } from '../../api/hr.api';
import { apiClient } from '../../api/http';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const HRDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [employeesRes, leaveRequestsRes, leaveTypesRes, departmentsRes] = await Promise.all([
        hrAPI.getEmployees(),
        hrAPI.getLeaveRequests(),
        hrAPI.getLeaveTypes(),
        apiClient.get('/departments')
      ]);

      setEmployees(employeesRes.data || []);
      setLeaveRequests(leaveRequestsRes.data || []);
      setLeaveTypes(leaveTypesRes.data || []);
      setDepartments(departmentsRes.data || []);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  // Calculate metrics
  const totalEmployees = employees.length;
  const employeesWithManagers = employees.filter(emp => emp.managerId).length;
  const pendingLeaveRequests = leaveRequests.filter(req => req.status === 'PENDING').length;
  const approvedLeaveRequests = leaveRequests.filter(req => req.status === 'APPROVED').length;
  const rejectedLeaveRequests = leaveRequests.filter(req => req.status === 'REJECTED').length;

  // Recent leave requests (last 5)
  const recentLeaveRequests = leaveRequests
    .sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate))
    .slice(0, 5);

  // Department distribution
  const departmentStats = departments.map(dept => ({
    ...dept,
    employeeCount: dept.employeeCount ?? employees.filter(emp => emp.departmentId === dept.id).length
  }));

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-600 bg-green-100';
      case 'REJECTED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-primary-900">HR Dashboard</h1>
          <p className="text-primary-600 mt-1">Overview of human resources metrics and activities</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="modern-card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Total Employees</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{totalEmployees}</p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Active workforce
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Departments</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{departments.length}</p>
                <p className="text-xs text-primary-600 mt-1">
                  <Building className="w-3 h-3 inline mr-1" />
                  Organizational units
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <Building className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">With Managers</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{employeesWithManagers}</p>
                <p className="text-xs text-primary-600 mt-1">
                  <UserCheck className="w-3 h-3 inline mr-1" />
                  Reporting structure
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Leave Types</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{leaveTypes.length}</p>
                <p className="text-xs text-primary-600 mt-1">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Available policies
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Leave Requests Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="modern-card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Pending Requests</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{pendingLeaveRequests}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            {pendingLeaveRequests > 0 && (
              <div className="mt-2 flex items-center text-xs text-yellow-600">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Requires attention
              </div>
            )}
          </div>

          <div className="modern-card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Approved Requests</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{approvedLeaveRequests}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Rejected Requests</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{rejectedLeaveRequests}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leave Requests */}
          <div className="modern-card-elevated">
            <div className="px-6 py-4 border-b border-primary-200">
              <h3 className="text-lg font-semibold text-primary-900">Recent Leave Requests</h3>
            </div>
            <div className="p-6">
              {recentLeaveRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No recent leave requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentLeaveRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-xs">
                            {request.employee?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'NA'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-primary-900">
                            {request.employee?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-primary-600">
                            {request.leaveType?.name} • {new Date(request.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span>{request.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Department Distribution */}
          <div className="modern-card-elevated">
            <div className="px-6 py-4 border-b border-primary-200">
              <h3 className="text-lg font-semibold text-primary-900">Department Distribution</h3>
            </div>
            <div className="p-6">
              {departmentStats.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No departments found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {departmentStats.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Building className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-primary-900">{dept.name}</p>
                          <p className="text-xs text-primary-600">{dept.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary-900">{dept.employeeCount}</p>
                        <p className="text-xs text-primary-600">employees</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="modern-card-elevated p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => window.location.href = '/hr/employees'}
              className="btn-modern btn-secondary flex items-center justify-center space-x-2 p-4"
            >
              <Users className="w-5 h-5" />
              <span>Manage Employees</span>
            </button>
            <button 
              onClick={() => window.location.href = '/hr/leave-requests'}
              className="btn-modern btn-secondary flex items-center justify-center space-x-2 p-4"
            >
              <Calendar className="w-5 h-5" />
              <span>Leave Requests</span>
            </button>
            <button 
              onClick={() => window.location.href = '/hr/leave-types'}
              className="btn-modern btn-secondary flex items-center justify-center space-x-2 p-4"
            >
              <Clock className="w-5 h-5" />
              <span>Leave Types</span>
            </button>
            <button 
              onClick={() => window.location.href = '/departments'}
              className="btn-modern btn-secondary flex items-center justify-center space-x-2 p-4"
            >
              <Building className="w-5 h-5" />
              <span>Departments</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HRDashboard;