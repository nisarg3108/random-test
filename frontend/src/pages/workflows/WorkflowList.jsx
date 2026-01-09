import React, { useEffect, useState } from 'react';
import { workflowsAPI } from '../../api/workflows.api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import FormField from '../../components/forms/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { RoleGuard } from '../../hooks/useAuth';

const WorkflowList = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    module: '',
    action: '',
    steps: []
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await workflowsAPI.createWorkflow(formData);
      setShowModal(false);
      setFormData({ module: '', action: '', steps: [] });
      fetchWorkflows();
    } catch (err) {
      setError(err.message || 'Failed to create workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (workflow) => {
    console.log('Edit workflow:', workflow);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure?')) {
      try {
        await workflowsAPI.deleteWorkflow(id);
        fetchWorkflows();
      } catch (err) {
        setError(err.message || 'Failed to delete workflow');
      }
    }
  };

  const columns = [
    { key: 'module', label: 'Module' },
    { key: 'action', label: 'Action' },
    { key: 'id', label: 'ID' }
  ];

  const moduleOptions = [
    { value: 'INVENTORY', label: 'Inventory' },
    { value: 'USER', label: 'User Management' },
    { value: 'DEPARTMENT', label: 'Department' },
    { value: 'COMPANY', label: 'Company' }
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
                <h1 className="text-3xl font-bold text-gray-900">Workflow Management</h1>
                <p className="text-gray-600 mt-1">Manage approval workflows and processes</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Create Workflow
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">All Workflows</h2>
              </div>
              <div className="p-6">
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <DataTable
                    columns={columns}
                    data={workflows}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )}
              </div>
            </div>

            <Modal
              isOpen={showModal}
              onClose={() => { setShowModal(false); setError(null); }}
              title="Create Workflow"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={formData.action}
                  onChange={handleChange}
                  required
                />
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setError(null); }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Creating...' : 'Create'}
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