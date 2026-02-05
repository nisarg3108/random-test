import React, { useEffect, useState } from 'react';
import { workflowsAPI } from '../../api/workflows.api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import FormField from '../../components/forms/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { RoleGuard } from '../../hooks/useAuth';
import { Plus, Trash2, Edit2, GitBranch, CheckCircle, AlertCircle, ArrowRight, Users } from 'lucide-react';

const WorkflowList = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [formData, setFormData] = useState({
    module: '',
    action: '',
    steps: []
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await workflowsAPI.getWorkflows();
      setWorkflows(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ module: '', action: '', steps: [] });
    setEditingWorkflow(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (editingWorkflow) {
        await workflowsAPI.updateWorkflow(editingWorkflow.id, formData);
        setSuccess('Workflow updated successfully');
      } else {
        await workflowsAPI.createWorkflow(formData);
        setSuccess('Workflow created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchWorkflows();
    } catch (err) {
      setError(err.message || `Failed to ${editingWorkflow ? 'update' : 'create'} workflow`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      module: workflow.module || '',
      action: workflow.action || '',
      steps: workflow.steps || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      try {
        await workflowsAPI.deleteWorkflow(id);
        setSuccess('Workflow deleted successfully');
        fetchWorkflows();
      } catch (err) {
        setError(err.message || 'Failed to delete workflow');
      }
    }
  };

  // Step management functions
  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        {
          stepNumber: formData.steps.length + 1,
          approverRole: 'MANAGER',
          isRequired: true,
          escalationDays: 3
        }
      ]
    });
  };

  const removeStep = (index) => {
    const newSteps = formData.steps.filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, stepNumber: i + 1 }));
    setFormData({ ...formData, steps: newSteps });
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  const columns = [
    { 
      key: 'module', 
      label: 'Module',
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {value}
        </span>
      )
    },
    { 
      key: 'action', 
      label: 'Action',
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'steps',
      label: 'Approval Steps',
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium">
            {value?.length || 0} step(s)
          </span>
          {value?.length > 0 && (
            <div className="flex items-center text-xs text-gray-500">
              {value.map((step, i) => (
                <React.Fragment key={i}>
                  <span className="px-1">{step.approverRole}</span>
                  {i < value.length - 1 && <ArrowRight className="w-3 h-3" />}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {value !== false ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  const moduleOptions = [
    { value: 'INVENTORY', label: 'Inventory' },
    { value: 'USER', label: 'User Management' },
    { value: 'DEPARTMENT', label: 'Department' },
    { value: 'COMPANY', label: 'Company' },
    { value: 'LEAVE', label: 'Leave Requests' },
    { value: 'EXPENSE', label: 'Expense Claims' },
    { value: 'PURCHASE', label: 'Purchase Orders' },
    { value: 'ASSET', label: 'Asset Management' },
    { value: 'EMPLOYEE', label: 'Employee' }
  ];

  const actionOptions = [
    { value: 'CREATE', label: 'Create' },
    { value: 'UPDATE', label: 'Update' },
    { value: 'DELETE', label: 'Delete' },
    { value: 'APPROVE', label: 'Approve' },
    { value: 'SUBMIT', label: 'Submit' }
  ];

  const roleOptions = [
    { value: 'MANAGER', label: 'Manager' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'HR', label: 'HR Manager' },
    { value: 'FINANCE', label: 'Finance Manager' },
    { value: 'DEPARTMENT_HEAD', label: 'Department Head' }
  ];

  return (
    <RoleGuard requiredRole="MANAGER" fallback={
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    }>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <GitBranch className="w-8 h-8 text-indigo-600" />
                  Workflow Management
                </h1>
                <p className="text-gray-600 mt-1">Configure approval workflows and multi-step processes</p>
              </div>
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Create Workflow
              </button>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {success}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">All Workflows</h2>
              </div>
              <div className="p-6">
                {loading ? (
                  <LoadingSpinner />
                ) : workflows.length === 0 ? (
                  <div className="text-center py-12">
                    <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows configured</h3>
                    <p className="text-gray-500 mb-4">Create your first approval workflow to get started</p>
                    <button
                      onClick={() => { resetForm(); setShowModal(true); }}
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                    >
                      <Plus className="w-4 h-4" />
                      Create Workflow
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {columns.map(col => (
                            <th key={col.key} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              {col.label}
                            </th>
                          ))}
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {workflows.map((workflow) => (
                          <tr key={workflow.id} className="hover:bg-gray-50">
                            {columns.map(col => (
                              <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm">
                                {col.render ? col.render(workflow[col.key], workflow) : workflow[col.key]}
                              </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(workflow)}
                                  className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50"
                                  title="Edit workflow"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(workflow.id)}
                                  className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                                  title="Delete workflow"
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
                )}
              </div>
            </div>

            <Modal
              isOpen={showModal}
              onClose={() => { setShowModal(false); resetForm(); setError(null); }}
              title={editingWorkflow ? 'Edit Workflow' : 'Create Workflow'}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Module"
                    name="module"
                    type="select"
                    value={formData.module}
                    onChange={handleChange}
                    options={moduleOptions}
                    required
                  />
                  <FormField
                    label="Action"
                    name="action"
                    type="select"
                    value={formData.action}
                    onChange={handleChange}
                    options={actionOptions}
                    required
                  />
                </div>

                {/* Approval Steps Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      Approval Steps
                    </h3>
                    <button
                      type="button"
                      onClick={addStep}
                      className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add Step
                    </button>
                  </div>

                  {formData.steps.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <p className="text-gray-500 mb-2">No approval steps configured</p>
                      <button
                        type="button"
                        onClick={addStep}
                        className="text-indigo-600 hover:text-indigo-700 text-sm"
                      >
                        Add your first approval step
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Approver Role</label>
                              <select
                                value={step.approverRole}
                                onChange={(e) => updateStep(index, 'approverRole', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                {roleOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Escalation (days)</label>
                              <input
                                type="number"
                                value={step.escalationDays || 3}
                                onChange={(e) => updateStep(index, 'escalationDays', parseInt(e.target.value))}
                                min={1}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={step.isRequired !== false}
                                  onChange={(e) => updateStep(index, 'isRequired', e.target.checked)}
                                  className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">Required</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => removeStep(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); setError(null); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Saving...' : editingWorkflow ? 'Update Workflow' : 'Create Workflow'}
                  </button>
                </div>
              </form>
            </Modal>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};

export default WorkflowList;