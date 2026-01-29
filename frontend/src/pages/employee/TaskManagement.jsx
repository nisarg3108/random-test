import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../../api/employee.api.js';
import { getUserRole } from '../../store/auth.store.js';
import { Plus, Users, Calendar, AlertCircle, CheckCircle, Clock, AlertTriangle, Edit } from 'lucide-react';
import Layout from '../../components/layout/Layout.jsx';

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('assigned');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const userRole = getUserRole();
  const [formData, setFormData] = useState({
    employeeId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  const fetchTasks = async () => {
    try {
      setError(null);
      const response = await employeeAPI.getManagerTasks();
      setTasks(response.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getEmployees();
      setEmployees(response.data || []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      setError('Failed to load employees. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      await employeeAPI.createTask(formData);
      setSuccess('Task assigned successfully!');
      setShowForm(false);
      setFormData({
        employeeId: '',
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: ''
      });
      fetchTasks();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to create task:', err);
      setError(err.response?.data?.message || 'Failed to assign task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'text-emerald-600 bg-emerald-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      case 'PENDING': return 'text-amber-600 bg-amber-100';
      default: return 'text-primary-600 bg-primary-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4" />;
      case 'PENDING': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-amber-100 text-amber-700';
      case 'MEDIUM': return 'bg-blue-100 text-blue-700';
      case 'LOW': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-primary-100 text-primary-700';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'assigned') return true;
    return task.status === activeTab.toUpperCase();
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user has permission to assign tasks
  const canAssignTasks = userRole === 'ADMIN' || userRole === 'MANAGER';

  return (
    <Layout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Task Management</h1>
          <p className="text-primary-600 mt-1">Assign and track tasks for your team</p>
        </div>
        {canAssignTasks && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-modern btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Task</span>
          </button>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="modern-card-elevated p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">Total Tasks</p>
              <p className="text-xl font-bold text-primary-900 mt-1">{tasks.length}</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-50">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="modern-card-elevated p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">Pending</p>
              <p className="text-xl font-bold text-primary-900 mt-1">
                {tasks.filter(t => t.status === 'PENDING').length}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-yellow-50">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="modern-card-elevated p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">In Progress</p>
              <p className="text-xl font-bold text-primary-900 mt-1">
                {tasks.filter(t => t.status === 'IN_PROGRESS').length}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-blue-50">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="modern-card-elevated p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">Completed</p>
              <p className="text-xl font-bold text-primary-900 mt-1">
                {tasks.filter(t => t.status === 'COMPLETED').length}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Form */}
      {showForm && canAssignTasks && (
        <div className="modern-card-elevated p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Assign New Task</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Assign To *
                </label>
                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  required
                  className="input-modern"
                >
                  <option value="">Choose Employee</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.designation || 'Employee'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Priority *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  required
                  className="input-modern"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="input-modern"
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="input-modern"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className="input-modern"
                placeholder="Describe the task requirements, expectations, and deliverables..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                className="btn-modern btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-modern btn-primary"
              >
                {submitting ? 'Assigning...' : 'Assign Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task Tabs */}
      <div className="modern-card-elevated">
        <div className="border-b border-primary-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'assigned', name: 'All Tasks', count: tasks.length },
              { id: 'pending', name: 'Pending', count: tasks.filter(t => t.status === 'PENDING').length },
              { id: 'in_progress', name: 'In Progress', count: tasks.filter(t => t.status === 'IN_PROGRESS').length },
              { id: 'completed', name: 'Completed', count: tasks.filter(t => t.status === 'COMPLETED').length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-primary-500 hover:text-primary-700 hover:border-primary-300'
                }`}
              >
                <span>{tab.name}</span>
                <span className="bg-primary-100 text-primary-600 px-2 py-1 rounded-full text-xs font-medium">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tasks found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div key={task.id} className="border border-primary-200 rounded-lg p-4 hover:bg-primary-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-primary-900">{task.title}</h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          <span>{task.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <p className="text-sm text-primary-600 mt-2">{task.description}</p>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-primary-600">Assigned to: </span>
                          <span className="font-medium">{task.employee?.name || 'Unknown'}</span>
                        </div>
                        {task.dueDate && (
                          <div>
                            <span className="text-primary-600">Due: </span>
                            <span className="font-medium">{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-primary-600">Created: </span>
                          <span className="font-medium">{new Date(task.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default TaskManagement;