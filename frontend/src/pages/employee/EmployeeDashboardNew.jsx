import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../../api/employee.api.js';
import { User, Calendar, Clock, DollarSign, FileText, Bell, CheckCircle, AlertCircle, XCircle, Target, TrendingUp, Plus } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const EmployeeDashboardNew = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    fetchDashboard();
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    try {
      const [typesRes, requestsRes] = await Promise.all([
        employeeAPI.getLeaveTypes(),
        employeeAPI.getMyLeaveRequests()
      ]);
      setLeaveTypes(typesRes.data);
      setLeaveRequests(requestsRes.data);
    } catch (err) {
      console.error('Failed to fetch leave data:', err);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getDashboard();
      setDashboard(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusUpdate = async (taskId, status) => {
    try {
      await employeeAPI.updateTaskStatus(taskId, status);
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleNotificationRead = async (notificationId) => {
    try {
      await employeeAPI.markNotificationRead(notificationId);
      fetchDashboard();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      await employeeAPI.createLeaveRequest(leaveFormData);
      setShowLeaveForm(false);
      setLeaveFormData({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
      fetchLeaveData();
    } catch (err) {
      setError('Failed to submit leave request');
    }
  };

  const handleLeaveInputChange = (e) => {
    const { name, value } = e.target;
    setLeaveFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4" />;
      case 'PENDING': return <AlertCircle className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </Layout>
    );
  }

  if (!dashboard) return <Layout><div>No data available</div></Layout>;

  const { employee, taskStats, upcomingDeadlines } = dashboard;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="modern-card-elevated p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-900">Welcome, {employee.name}</h1>
              <p className="text-primary-600">{employee.designation} • {employee.department.name}</p>
              {employee.manager && (
                <p className="text-sm text-primary-500">Reports to: {employee.manager.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="modern-card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Pending Tasks</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{taskStats.pending}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  Need attention
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">In Progress</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{taskStats.inProgress}</p>
                <p className="text-xs text-blue-600 mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Active work
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Completed</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{taskStats.completed}</p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Achievements
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Notifications</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{employee.notifications?.length || 0}</p>
                <p className="text-xs text-primary-600 mt-1">
                  <Bell className="w-3 h-3 inline mr-1" />
                  Updates
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <Bell className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="modern-card-elevated">
          <div className="border-b border-primary-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: User },
                { id: 'tasks', name: 'My Tasks', icon: Target },
                { id: 'leave', name: 'Leave Request', icon: Calendar },
                { id: 'salary', name: 'Salary Info', icon: DollarSign },
                { id: 'notifications', name: 'Notifications', icon: Bell }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-primary-500 hover:text-primary-700 hover:border-primary-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Department Info */}
                <div>
                  <h3 className="text-lg font-semibold text-primary-900 mb-4">Department Information</h3>
                  <div className="bg-primary-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-primary-600">Department</p>
                        <p className="text-primary-900 font-medium">{employee.department.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary-600">Employee Code</p>
                        <p className="text-primary-900 font-medium">{employee.employeeCode}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary-600">Joining Date</p>
                        <p className="text-primary-900 font-medium">{new Date(employee.joiningDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary-600">Status</p>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {employee.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Deadlines */}
                {upcomingDeadlines.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-primary-900 mb-4">Upcoming Deadlines</h3>
                    <div className="space-y-3">
                      {upcomingDeadlines.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div>
                            <p className="font-medium text-primary-900">{task.title}</p>
                            <p className="text-sm text-primary-600">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div>
                <h3 className="text-lg font-semibold text-primary-900 mb-4">My Tasks</h3>
                <div className="space-y-4">
                  {employee.tasks?.map((task) => (
                    <div key={task.id} className="border border-primary-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-primary-900">{task.title}</h4>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          <p className="text-sm text-primary-600 mt-1">{task.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-primary-500">
                            <span>Assigned by: {task.assigner.name}</span>
                            {task.dueDate && (
                              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {getStatusIcon(task.status)}
                            <span>{task.status.replace('_', ' ')}</span>
                          </div>
                          <select
                            value={task.status}
                            onChange={(e) => handleTaskStatusUpdate(task.id, e.target.value)}
                            className="text-sm border border-primary-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!employee.tasks || employee.tasks.length === 0) && (
                    <div className="text-center py-8">
                      <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No tasks assigned yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'leave' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-primary-900">Leave Requests</h3>
                  <button
                    onClick={() => setShowLeaveForm(true)}
                    className="btn-modern btn-primary flex items-center space-x-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Request Leave</span>
                  </button>
                </div>

                {/* Leave Request Form */}
                {showLeaveForm && (
                  <div className="bg-primary-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-primary-900 mb-3">New Leave Request</h4>
                    <form onSubmit={handleLeaveSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-primary-700 mb-1">Leave Type *</label>
                          <select
                            name="leaveTypeId"
                            value={leaveFormData.leaveTypeId}
                            onChange={handleLeaveInputChange}
                            required
                            className="input-modern"
                          >
                            <option value="">Select leave type</option>
                            {leaveTypes.map(type => (
                              <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-700 mb-1">Start Date *</label>
                          <input
                            type="date"
                            name="startDate"
                            value={leaveFormData.startDate}
                            onChange={handleLeaveInputChange}
                            required
                            className="input-modern"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary-700 mb-1">End Date *</label>
                          <input
                            type="date"
                            name="endDate"
                            value={leaveFormData.endDate}
                            onChange={handleLeaveInputChange}
                            required
                            className="input-modern"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary-700 mb-1">Reason *</label>
                        <textarea
                          name="reason"
                          value={leaveFormData.reason}
                          onChange={handleLeaveInputChange}
                          required
                          rows={3}
                          className="input-modern"
                          placeholder="Please provide reason for leave"
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowLeaveForm(false)}
                          className="btn-modern btn-secondary"
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn-modern btn-primary">
                          Submit Request
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Leave Requests List */}
                <div className="space-y-4">
                  {leaveRequests.map((request) => (
                    <div key={request.id} className="border border-primary-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-primary-900">{request.leaveType?.name}</h4>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          <p className="text-sm text-primary-600 mt-1">{request.reason}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-primary-500">
                            <span>{new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}</span>
                            <span>Applied: {new Date(request.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {leaveRequests.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No leave requests yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'salary' && (
              <div>
                <h3 className="text-lg font-semibold text-primary-900 mb-4">Salary Information</h3>
                {employee.salaryStructure ? (
                  <div className="bg-primary-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-center">
                        <h4 className="font-medium text-primary-600 mb-2">Basic Salary</h4>
                        <p className="text-3xl font-bold text-green-600">
                          ₹{employee.salaryStructure.basicSalary.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <h4 className="font-medium text-primary-600 mb-2">Net Salary</h4>
                        <p className="text-3xl font-bold text-blue-600">
                          ₹{employee.salaryStructure.netSalary.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-primary-900 mb-3">Allowances</h4>
                        <div className="space-y-2">
                          {Object.entries(employee.salaryStructure.allowances).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="capitalize text-primary-600">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="font-medium text-primary-900">₹{value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-primary-900 mb-3">Deductions</h4>
                        <div className="space-y-2">
                          {Object.entries(employee.salaryStructure.deductions).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="capitalize text-primary-600">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="font-medium text-primary-900">₹{value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Salary structure not configured yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h3 className="text-lg font-semibold text-primary-900 mb-4">Notifications</h3>
                <div className="space-y-3">
                  {employee.notifications?.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.isRead ? 'bg-primary-50 border-primary-200' : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-primary-900">{notification.title}</h4>
                          <p className="text-sm text-primary-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-primary-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleNotificationRead(notification.id)}
                            className="btn-modern btn-primary text-sm"
                          >
                            Mark as Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!employee.notifications || employee.notifications.length === 0) && (
                    <div className="text-center py-8">
                      <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No notifications.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeDashboardNew;