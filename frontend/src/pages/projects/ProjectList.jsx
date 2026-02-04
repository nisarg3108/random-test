import React, { useEffect, useState } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp,
  Clock,
  Filter
} from 'lucide-react';
import { projectAPI } from '../../api/project.api';
import { apiClient } from '../../api/http';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link, useNavigate } from 'react-router-dom';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    clientName: '',
    projectManager: '',
    status: 'PLANNING',
    priority: 'MEDIUM',
    type: 'CLIENT',
    startDate: '',
    endDate: '',
    estimatedBudget: '',
    departmentId: '',
    notes: ''
  });

  const loadProjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;

      const response = await projectAPI.getProjects(params);
      setProjects(response.data || []);
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const response = await projectAPI.getDashboard();
      setDashboard(response.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await apiClient.get('/departments');
      setDepartments(response.data || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await apiClient.get('/employees');
      setEmployees(response.data || []);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  useEffect(() => {
    loadProjects();
    loadDashboard();
    loadDepartments();
    loadEmployees();
  }, [filterStatus, filterPriority]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const projectData = {
        ...formData,
        estimatedBudget: parseFloat(formData.estimatedBudget) || 0,
      };

      await projectAPI.createProject(projectData);
      setShowModal(false);
      resetForm();
      loadProjects();
      loadDashboard();
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      projectName: '',
      description: '',
      clientName: '',
      projectManager: '',
      status: 'PLANNING',
      priority: 'MEDIUM',
      type: 'CLIENT',
      startDate: '',
      endDate: '',
      estimatedBudget: '',
      departmentId: '',
      notes: ''
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PLANNING: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-green-100 text-green-800',
      ON_HOLD: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return statusConfig[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800',
    };
    return priorityConfig[priority] || 'bg-gray-100 text-gray-800';
  };

  const filteredProjects = projects.filter(project => {
    const name = project.projectName || '';
    const client = project.clientName || '';
    const code = project.projectCode || '';
    
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           client.toLowerCase().includes(searchTerm.toLowerCase()) ||
           code.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading && projects.length === 0) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Project Management</h1>
            <p className="text-primary-600 mt-1">Track and manage all projects</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-modern btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Dashboard Stats */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="modern-card-elevated p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-600">Total Projects</p>
                  <p className="text-2xl font-bold text-primary-900 mt-1">
                    {dashboard.stats.totalProjects}
                  </p>
                </div>
                <FolderKanban className="w-10 h-10 text-blue-500 opacity-80" />
              </div>
            </div>

            <div className="modern-card-elevated p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-600">Active Projects</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {dashboard.stats.activeProjects}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500 opacity-80" />
              </div>
            </div>

            <div className="modern-card-elevated p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-600">Total Budget</p>
                  <p className="text-2xl font-bold text-primary-900 mt-1">
                    ${dashboard.stats.totalBudget.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-blue-500 opacity-80" />
              </div>
            </div>

            <div className="modern-card-elevated p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-600 mt-1">
                    {dashboard.stats.completedProjects}
                  </p>
                </div>
                <FolderKanban className="w-10 h-10 text-gray-500 opacity-80" />
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="modern-card p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input-modern pl-10 w-full"
                />
              </div>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-input-modern w-full"
              >
                <option value="">All Status</option>
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="form-input-modern w-full"
              >
                <option value="">All Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="modern-card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Budget</th>
                  <th>Progress</th>
                  <th>Timeline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-primary-600">
                      No projects found
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <div>
                          <div className="font-medium text-primary-900">{project.projectName}</div>
                          <div className="text-sm text-primary-600">{project.projectCode}</div>
                        </div>
                      </td>
                      <td>{project.clientName || '-'}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(project.status)}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getPriorityBadge(project.priority)}`}>
                          {project.priority}
                        </span>
                      </td>
                      <td>${project.estimatedBudget.toLocaleString()}</td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${project.progressPercent}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-primary-600">{project.progressPercent}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          {project.startDate && (
                            <div className="text-primary-600">
                              {new Date(project.startDate).toLocaleDateString()}
                            </div>
                          )}
                          {project.endDate && (
                            <div className="text-primary-500">
                              → {new Date(project.endDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <Link
                          to={`/projects/${project.id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Project Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="modern-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white pb-4 border-b border-primary-200 mb-4">
                <h2 className="text-xl font-bold text-primary-900">Create New Project</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="form-label">Project Name *</label>
                    <input
                      type="text"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleChange}
                      required
                      className="form-input-modern"
                      placeholder="Enter project name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      className="form-input-modern"
                      placeholder="Project description"
                    />
                  </div>

                  <div>
                    <label className="form-label">Client Name</label>
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      className="form-input-modern"
                      placeholder="Client name"
                    />
                  </div>

                  <div>
                    <label className="form-label">Project Manager *</label>
                    <select
                      name="projectManager"
                      value={formData.projectManager}
                      onChange={handleChange}
                      required
                      className="form-input-modern"
                    >
                      <option value="">Select Manager</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.userId || emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Department</label>
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleChange}
                      className="form-input-modern"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Project Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="form-input-modern"
                    >
                      <option value="CLIENT">Client</option>
                      <option value="INTERNAL">Internal</option>
                      <option value="R&D">R&D</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="form-input-modern"
                    >
                      <option value="PLANNING">Planning</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Priority</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="form-input-modern"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="form-input-modern"
                    />
                  </div>

                  <div>
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="form-input-modern"
                    />
                  </div>

                  <div>
                    <label className="form-label">Estimated Budget</label>
                    <input
                      type="number"
                      name="estimatedBudget"
                      value={formData.estimatedBudget}
                      onChange={handleChange}
                      step="0.01"
                      className="form-input-modern"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="form-label">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="2"
                      className="form-input-modern"
                      placeholder="Additional notes"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-primary-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn-modern btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-modern btn-primary"
                  >
                    {loading ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProjectList;
