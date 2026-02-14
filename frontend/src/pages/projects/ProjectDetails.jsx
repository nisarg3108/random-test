import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Target,
  TrendingUp,
  Edit,
  Plus,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { projectAPI } from '../../api/project.api';
import { apiClient } from '../../api/http';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProjectTeamTab from './ProjectTeamTab';
import TeamCapacityDashboard from './TeamCapacityDashboard';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal states
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form data
  const [milestoneForm, setMilestoneForm] = useState({
    milestoneName: '',
    description: '',
    status: 'NOT_STARTED',
    startDate: '',
    dueDate: '',
    progressPercent: 0,
    assignedTo: '',
    notes: '',
  });

  const [resourceForm, setResourceForm] = useState({
    resourceType: 'HUMAN',
    resourceName: '',
    employeeId: '',
    allocationPercent: 100,
    startDate: '',
    endDate: '',
    costPerUnit: 0,
    units: 1,
    status: 'ALLOCATED',
    notes: '',
  });

  const [budgetForm, setBudgetForm] = useState({
    category: 'LABOR',
    description: '',
    plannedAmount: 0,
    actualAmount: 0,
    budgetPeriod: '',
    transactionDate: '',
    notes: '',
  });

  const [timeLogForm, setTimeLogForm] = useState({
    logDate: new Date().toISOString().split('T')[0],
    hoursWorked: 0,
    taskDescription: '',
    milestoneId: '',
    billable: true,
    hourlyRate: 0,
    notes: '',
  });

  const loadProject = async () => {
    setLoading(true);
    try {
      const response = await projectAPI.getProjectById(id);
      setProject(response.data);
    } catch (err) {
      setError('Failed to load project');
    } finally {
      setLoading(false);
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
    loadProject();
    loadEmployees();
  }, [id]);

  const handleMilestoneSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...milestoneForm, projectId: id };
      if (editingItem) {
        await projectAPI.updateMilestone(editingItem.id, data);
      } else {
        await projectAPI.createMilestone(data);
      }
      setShowMilestoneModal(false);
      resetMilestoneForm();
      loadProject();
    } catch (err) {
      setError('Failed to save milestone');
    }
  };

  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...resourceForm, projectId: id };
      if (editingItem) {
        await projectAPI.updateResource(editingItem.id, data);
      } else {
        await projectAPI.allocateResource(data);
      }
      setShowResourceModal(false);
      resetResourceForm();
      loadProject();
    } catch (err) {
      setError('Failed to save resource');
    }
  };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...budgetForm, projectId: id };
      if (editingItem) {
        await projectAPI.updateBudget(editingItem.id, data);
      } else {
        await projectAPI.createBudget(data);
      }
      setShowBudgetModal(false);
      resetBudgetForm();
      loadProject();
    } catch (err) {
      setError('Failed to save budget entry');
    }
  };

  const handleTimeLogSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...timeLogForm, projectId: id };
      if (editingItem) {
        await projectAPI.updateTimeLog(editingItem.id, data);
      } else {
        await projectAPI.logTime(data);
      }
      setShowTimeLogModal(false);
      resetTimeLogForm();
      loadProject();
    } catch (err) {
      setError('Failed to save time log');
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      try {
        await projectAPI.deleteMilestone(milestoneId);
        loadProject();
      } catch (err) {
        setError('Failed to delete milestone');
      }
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await projectAPI.deleteResource(resourceId);
        loadProject();
      } catch (err) {
        setError('Failed to delete resource');
      }
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (window.confirm('Are you sure you want to delete this budget entry?')) {
      try {
        await projectAPI.deleteBudget(budgetId);
        loadProject();
      } catch (err) {
        setError('Failed to delete budget entry');
      }
    }
  };

  const handleDeleteTimeLog = async (timeLogId) => {
    if (window.confirm('Are you sure you want to delete this time log?')) {
      try {
        await projectAPI.deleteTimeLog(timeLogId);
        loadProject();
      } catch (err) {
        setError('Failed to delete time log');
      }
    }
  };

  const resetMilestoneForm = () => {
    setMilestoneForm({
      milestoneName: '',
      description: '',
      status: 'NOT_STARTED',
      startDate: '',
      dueDate: '',
      progressPercent: 0,
      assignedTo: '',
      notes: '',
    });
    setEditingItem(null);
  };

  const resetResourceForm = () => {
    setResourceForm({
      resourceType: 'HUMAN',
      resourceName: '',
      employeeId: '',
      allocationPercent: 100,
      startDate: '',
      endDate: '',
      costPerUnit: 0,
      units: 1,
      status: 'ALLOCATED',
      notes: '',
    });
    setEditingItem(null);
  };

  const resetBudgetForm = () => {
    setBudgetForm({
      category: 'LABOR',
      description: '',
      plannedAmount: 0,
      actualAmount: 0,
      budgetPeriod: '',
      transactionDate: '',
      notes: '',
    });
    setEditingItem(null);
  };

  const resetTimeLogForm = () => {
    setTimeLogForm({
      logDate: new Date().toISOString().split('T')[0],
      hoursWorked: 0,
      taskDescription: '',
      milestoneId: '',
      billable: true,
      hourlyRate: 0,
      notes: '',
    });
    setEditingItem(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PLANNING: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-green-100 text-green-800',
      ON_HOLD: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NOT_STARTED: 'bg-gray-100 text-gray-800',
      DELAYED: 'bg-red-100 text-red-800',
      ALLOCATED: 'bg-blue-100 text-blue-800',
      ACTIVE: 'bg-green-100 text-green-800',
      RELEASED: 'bg-gray-100 text-gray-800',
      LOGGED: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return statusConfig[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">Project not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/projects')}
              className="btn-modern btn-secondary"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-primary-900">{project.projectName}</h1>
              <p className="text-primary-600">{project.projectCode}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <span className={`badge ${getStatusBadge(project.status)}`}>
              {project.status?.replace('_', ' ') || 'N/A'}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Project Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="modern-card p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-primary-600">Budget</p>
                <p className="text-xl font-bold text-primary-900">
                  ${(project.estimatedBudget || 0).toLocaleString()}
                </p>
                <p className="text-xs text-primary-500">
                  Actual: ${(project.actualCost || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="modern-card p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-primary-600">Progress</p>
                <p className="text-xl font-bold text-primary-900">{project.progressPercent}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${project.progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="modern-card p-4">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-primary-600">Milestones</p>
                <p className="text-xl font-bold text-primary-900">{project.milestones?.length || 0}</p>
                <p className="text-xs text-primary-500">
                  {project.milestones?.filter((m) => m.status === 'COMPLETED').length || 0} completed
                </p>
              </div>
            </div>
          </div>

          <div className="modern-card p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-primary-600">Time Logs</p>
                <p className="text-xl font-bold text-primary-900">{project.timeLogs?.length || 0}</p>
                <p className="text-xs text-primary-500">
                  {project.timeLogs?.reduce((sum, log) => sum + log.hoursWorked, 0) || 0} hours
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="modern-card p-6">
          <h2 className="text-lg font-bold text-primary-900 mb-4">Project Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-primary-600">Client</p>
              <p className="font-medium text-primary-900">{project.clientName || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-primary-600">Type</p>
              <p className="font-medium text-primary-900">{project.type || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-primary-600">Priority</p>
              <p className="font-medium text-primary-900">{project.priority}</p>
            </div>
            <div>
              <p className="text-sm text-primary-600">Department</p>
              <p className="font-medium text-primary-900">{project.department?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-primary-600">Start Date</p>
              <p className="font-medium text-primary-900">
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-primary-600">End Date</p>
              <p className="font-medium text-primary-900">
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
              </p>
            </div>
          </div>
          {project.description && (
            <div className="mt-4">
              <p className="text-sm text-primary-600">Description</p>
              <p className="text-primary-900">{project.description}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="modern-card">
          <div className="border-b border-primary-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
              {['overview', 'milestones', 'resources', 'budget', 'timeLogs', 'team', 'capacity'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-primary-600 hover:text-primary-900 hover:border-primary-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1')}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Milestones Tab */}
            {activeTab === 'milestones' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-primary-900">Milestones</h3>
                  <button
                    onClick={() => setShowMilestoneModal(true)}
                    className="btn-modern btn-primary btn-sm flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Milestone</span>
                  </button>
                </div>

                {project.milestones && project.milestones.length > 0 ? (
                  <div className="space-y-3">
                    {project.milestones.map((milestone) => (
                      <div key={milestone.id} className="border border-primary-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-primary-900">{milestone.milestoneName}</h4>
                              <span className={`badge ${getStatusBadge(milestone.status)}`}>
                                {milestone.status.replace('_', ' ')}
                              </span>
                            </div>
                            {milestone.description && (
                              <p className="text-sm text-primary-600 mt-1">{milestone.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-sm text-primary-600">
                              {milestone.dueDate && (
                                <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                              )}
                              <span>Progress: {milestone.progressPercent}%</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingItem(milestone);
                                setMilestoneForm(milestone);
                                setShowMilestoneModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMilestone(milestone.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-primary-600 py-8">No milestones yet</p>
                )}
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-primary-900">Resources</h3>
                  <button
                    onClick={() => setShowResourceModal(true)}
                    className="btn-modern btn-primary btn-sm flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Allocate Resource</span>
                  </button>
                </div>

                {project.resources && project.resources.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Name</th>
                          <th>Allocation</th>
                          <th>Cost</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.resources.map((resource) => (
                          <tr key={resource.id}>
                            <td>{resource.resourceType}</td>
                            <td>{resource.resourceName}</td>
                            <td>{resource.allocationPercent}%</td>
                            <td>${resource.totalCost.toLocaleString()}</td>
                            <td>
                              <span className={`badge ${getStatusBadge(resource.status)}`}>
                                {resource.status}
                              </span>
                            </td>
                            <td>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingItem(resource);
                                    setResourceForm(resource);
                                    setShowResourceModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteResource(resource.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-primary-600 py-8">No resources allocated</p>
                )}
              </div>
            )}

            {/* Budget Tab */}
            {activeTab === 'budget' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-primary-900">Budget Tracking</h3>
                  <button
                    onClick={() => setShowBudgetModal(true)}
                    className="btn-modern btn-primary btn-sm flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Budget Entry</span>
                  </button>
                </div>

                {project.budgets && project.budgets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Description</th>
                          <th>Planned</th>
                          <th>Actual</th>
                          <th>Variance</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.budgets.map((budget) => (
                          <tr key={budget.id}>
                            <td>{budget.category}</td>
                            <td>{budget.description || '-'}</td>
                            <td>${budget.plannedAmount.toLocaleString()}</td>
                            <td>${budget.actualAmount.toLocaleString()}</td>
                            <td className={budget.variance < 0 ? 'text-red-600' : 'text-green-600'}>
                              ${budget.variance.toLocaleString()}
                            </td>
                            <td>{new Date(budget.transactionDate).toLocaleDateString()}</td>
                            <td>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingItem(budget);
                                    setBudgetForm(budget);
                                    setShowBudgetModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBudget(budget.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-primary-600 py-8">No budget entries</p>
                )}
              </div>
            )}

            {/* Time Logs Tab */}
            {activeTab === 'timeLogs' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-primary-900">Time Tracking</h3>
                  <button
                    onClick={() => setShowTimeLogModal(true)}
                    className="btn-modern btn-primary btn-sm flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Time</span>
                  </button>
                </div>

                {project.timeLogs && project.timeLogs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Task</th>
                          <th>Hours</th>
                          <th>Billable</th>
                          <th>Cost</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.timeLogs.map((log) => (
                          <tr key={log.id}>
                            <td>{new Date(log.logDate).toLocaleDateString()}</td>
                            <td>{log.taskDescription}</td>
                            <td>{log.hoursWorked}h</td>
                            <td>{log.billable ? 'Yes' : 'No'}</td>
                            <td>${log.totalCost ? log.totalCost.toLocaleString() : '-'}</td>
                            <td>
                              <span className={`badge ${getStatusBadge(log.status)}`}>
                                {log.status}
                              </span>
                            </td>
                            <td>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingItem(log);
                                    setTimeLogForm(log);
                                    setShowTimeLogModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTimeLog(log.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-primary-600 py-8">No time logs</p>
                )}
              </div>
            )}

            {/* Team Management Tab */}
            {activeTab === 'team' && (
              <ProjectTeamTab projectId={project.id} />
            )}

            {/* Capacity Dashboard Tab */}
            {activeTab === 'capacity' && (
              <TeamCapacityDashboard projectId={project.id} />
            )}
          </div>
        </div>

        {/* Milestone Modal */}
        {showMilestoneModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="modern-card max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-primary-900 mb-4">
                {editingItem ? 'Edit Milestone' : 'Add Milestone'}
              </h2>
              <form onSubmit={handleMilestoneSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Milestone Name *</label>
                  <input
                    type="text"
                    value={milestoneForm.milestoneName}
                    onChange={(e) =>
                      setMilestoneForm({ ...milestoneForm, milestoneName: e.target.value })
                    }
                    required
                    className="form-input-modern"
                  />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    value={milestoneForm.description}
                    onChange={(e) =>
                      setMilestoneForm({ ...milestoneForm, description: e.target.value })
                    }
                    rows="3"
                    className="form-input-modern"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Status</label>
                    <select
                      value={milestoneForm.status}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value })}
                      className="form-input-modern"
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="DELAYED">Delayed</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Progress %</label>
                    <input
                      type="number"
                      value={milestoneForm.progressPercent}
                      onChange={(e) =>
                        setMilestoneForm({ ...milestoneForm, progressPercent: parseFloat(e.target.value) })
                      }
                      min="0"
                      max="100"
                      className="form-input-modern"
                    />
                  </div>
                  <div>
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      value={milestoneForm.startDate}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, startDate: e.target.value })}
                      className="form-input-modern"
                    />
                  </div>
                  <div>
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      value={milestoneForm.dueDate}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                      className="form-input-modern"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMilestoneModal(false);
                      resetMilestoneForm();
                    }}
                    className="btn-modern btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-modern btn-primary">
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Similar modals for Resource, Budget, and TimeLog would go here */}
        {/* I'll add abbreviated versions for brevity */}
        
        {/* Resource Modal */}
        {showResourceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="modern-card max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-primary-900 mb-4">
                {editingItem ? 'Edit Resource' : 'Allocate Resource'}
              </h2>
              <form onSubmit={handleResourceSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Resource Type *</label>
                    <select
                      value={resourceForm.resourceType}
                      onChange={(e) => setResourceForm({ ...resourceForm, resourceType: e.target.value })}
                      required
                      className="form-input-modern"
                    >
                      <option value="HUMAN">Human</option>
                      <option value="EQUIPMENT">Equipment</option>
                      <option value="MATERIAL">Material</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Resource Name *</label>
                    <input
                      type="text"
                      value={resourceForm.resourceName}
                      onChange={(e) => setResourceForm({ ...resourceForm, resourceName: e.target.value })}
                      required
                      className="form-input-modern"
                    />
                  </div>
                  <div>
                    <label className="form-label">Allocation %</label>
                    <input
                      type="number"
                      value={resourceForm.allocationPercent}
                      onChange={(e) => setResourceForm({ ...resourceForm, allocationPercent: parseFloat(e.target.value) })}
                      min="0"
                      max="100"
                      className="form-input-modern"
                    />
                  </div>
                  <div>
                    <label className="form-label">Cost Per Unit</label>
                    <input
                      type="number"
                      value={resourceForm.costPerUnit}
                      onChange={(e) => setResourceForm({ ...resourceForm, costPerUnit: parseFloat(e.target.value) })}
                      step="0.01"
                      className="form-input-modern"
                    />
                  </div>
                  <div>
                    <label className="form-label">Units</label>
                    <input
                      type="number"
                      value={resourceForm.units}
                      onChange={(e) => setResourceForm({ ...resourceForm, units: parseFloat(e.target.value) })}
                      step="0.01"
                      className="form-input-modern"
                    />
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select
                      value={resourceForm.status}
                      onChange={(e) => setResourceForm({ ...resourceForm, status: e.target.value })}
                      className="form-input-modern"
                    >
                      <option value="ALLOCATED">Allocated</option>
                      <option value="ACTIVE">Active</option>
                      <option value="RELEASED">Released</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResourceModal(false);
                      resetResourceForm();
                    }}
                    className="btn-modern btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-modern btn-primary">
                    {editingItem ? 'Update' : 'Allocate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Budget Modal */}
        {showBudgetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="modern-card max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-primary-900 mb-4">
                {editingItem ? 'Edit Budget Entry' : 'Add Budget Entry'}
              </h2>
              <form onSubmit={handleBudgetSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Category *</label>
                    <select
                      value={budgetForm.category}
                      onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                      required
                      className="form-input-modern"
                    >
                      <option value="LABOR">Labor</option>
                      <option value="MATERIALS">Materials</option>
                      <option value="EQUIPMENT">Equipment</option>
                      <option value="OVERHEAD">Overhead</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Budget Period</label>
                    <input
                      type="text"
                      value={budgetForm.budgetPeriod}
                      onChange={(e) => setBudgetForm({ ...budgetForm, budgetPeriod: e.target.value })}
                      placeholder="Q1-2026"
                      className="form-input-modern"
                    />
                  </div>
                  <div>
                    <label className="form-label">Planned Amount *</label>
                    <input
                      type="number"
                      value={budgetForm.plannedAmount}
                      onChange={(e) => setBudgetForm({ ...budgetForm, plannedAmount: parseFloat(e.target.value) })}
                      step="0.01"
                      required
                      className="form-input-modern"
                    />
                  </div>
                  <div>
                    <label className="form-label">Actual Amount</label>
                    <input
                      type="number"
                      value={budgetForm.actualAmount}
                      onChange={(e) => setBudgetForm({ ...budgetForm, actualAmount: parseFloat(e.target.value) })}
                      step="0.01"
                      className="form-input-modern"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Description</label>
                    <textarea
                      value={budgetForm.description}
                      onChange={(e) => setBudgetForm({ ...budgetForm, description: e.target.value })}
                      rows="2"
                      className="form-input-modern"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBudgetModal(false);
                      resetBudgetForm();
                    }}
                    className="btn-modern btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-modern btn-primary">
                    {editingItem ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Time Log Modal */}
        {showTimeLogModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="modern-card max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-primary-900 mb-4">
                {editingItem ? 'Edit Time Log' : 'Log Time'}
              </h2>
              <form onSubmit={handleTimeLogSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      value={timeLogForm.logDate}
                      onChange={(e) => setTimeLogForm({ ...timeLogForm, logDate: e.target.value })}
                      required
                      className="form-input-modern"
                    />
                  </div>
                  <div>
                    <label className="form-label">Hours Worked *</label>
                    <input
                      type="number"
                      value={timeLogForm.hoursWorked}
                      onChange={(e) => setTimeLogForm({ ...timeLogForm, hoursWorked: parseFloat(e.target.value) })}
                      step="0.5"
                      required
                      className="form-input-modern"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Task Description *</label>
                    <textarea
                      value={timeLogForm.taskDescription}
                      onChange={(e) => setTimeLogForm({ ...timeLogForm, taskDescription: e.target.value })}
                      rows="3"
                      required
                      className="form-input-modern"
                    />
                  </div>
                  <div>
                    <label className="form-label">Hourly Rate</label>
                    <input
                      type="number"
                      value={timeLogForm.hourlyRate}
                      onChange={(e) => setTimeLogForm({ ...timeLogForm, hourlyRate: parseFloat(e.target.value) })}
                      step="0.01"
                      className="form-input-modern"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={timeLogForm.billable}
                        onChange={(e) => setTimeLogForm({ ...timeLogForm, billable: e.target.checked })}
                        className="form-checkbox"
                      />
                      <span className="form-label mb-0">Billable</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTimeLogModal(false);
                      resetTimeLogForm();
                    }}
                    className="btn-modern btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-modern btn-primary">
                    {editingItem ? 'Update' : 'Log Time'}
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

export default ProjectDetails;
