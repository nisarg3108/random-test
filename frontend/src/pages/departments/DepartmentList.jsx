import React, { useEffect, useState } from 'react';
import { 
  Building2, Plus, Search, Edit, Trash2, Users, 
  Calendar, MapPin
} from 'lucide-react';
import { apiClient } from '../../api/http';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    managerId: '',
    budget: ''
  });

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/departments');
      setDepartments(response.data || []);
    } catch (err) {
      setError('Failed to load departments');
      console.error('Load departments error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const deptData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null
      };

      if (editingDept) {
        await apiClient.put(`/departments/${editingDept.id}`, deptData);
      } else {
        await apiClient.post('/departments', deptData);
      }
      
      setShowModal(false);
      resetForm();
      loadDepartments();
    } catch (err) {
      setError(err.message || 'Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name || '',
      description: dept.description || '',
      location: dept.location || '',
      managerId: dept.managerId || '',
      budget: dept.budget?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await apiClient.delete(`/departments/${id}`);
        loadDepartments();
      } catch (err) {
        setError('Failed to delete department');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', location: '', managerId: '', budget: '' });
    setEditingDept(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredDepartments = departments.filter(dept => 
    dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: departments.length,
    active: departments.filter(dept => dept.status === 'ACTIVE').length,
    totalBudget: departments.reduce((sum, dept) => sum + (dept.budget || 0), 0)
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
            <p className="text-gray-600 mt-1">Manage organizational departments and structure</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-modern btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Departments', value: stats.total, icon: Building2, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Active Departments', value: stats.active, icon: Building2, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Total Budget', value: `₹${stats.totalBudget.toLocaleString()}`, icon: Building2, bg: 'bg-purple-50', color: 'text-purple-600' }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="modern-card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div className="modern-card-elevated p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search departments by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No departments found</p>
            </div>
          ) : (
            filteredDepartments.map((dept) => (
              <div key={dept.id} className="modern-card-elevated p-6 hover:modern-shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                      <p className="text-sm text-gray-500">ID: {dept.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleEdit(dept)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(dept.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {dept.description && (
                    <p className="text-sm text-gray-600">{dept.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-medium text-gray-900">
                      {dept.budget ? `₹${dept.budget.toLocaleString()}` : 'Not set'}
                    </span>
                  </div>

                  {dept.location && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{dept.location}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{dept.employeeCount || 0} employees</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Created {dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                    dept.status === 'ACTIVE' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {dept.status || 'Active'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Department Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="modern-card-elevated max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDept ? 'Edit Department' : 'Add New Department'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-modern"
                  placeholder="Enter department name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="input-modern"
                  placeholder="Enter department description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  className="input-modern"
                  placeholder="Enter location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input
                  name="budget"
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={handleChange}
                  className="input-modern"
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn-modern btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-modern btn-primary disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingDept ? 'Update Department' : 'Add Department')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DepartmentList;