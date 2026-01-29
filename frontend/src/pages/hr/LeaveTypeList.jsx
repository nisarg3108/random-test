import React, { useEffect, useState } from 'react';
import { Tag, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { hrAPI } from '../../api/hr.api';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LeaveTypeList = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxDays: '',
    carryForward: false,
    paid: true,
    requiresApproval: true
  });

  const loadLeaveTypes = async () => {
    setLoading(true);
    try {
      const response = await hrAPI.getLeaveTypes();
      setLeaveTypes(response.data || []);
    } catch (err) {
      setError('Failed to load leave types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const typeData = {
        ...formData,
        maxDays: formData.maxDays ? parseInt(formData.maxDays) : null
      };

      if (editingType) {
        await hrAPI.updateLeaveType(editingType.id, typeData);
      } else {
        await hrAPI.createLeaveType(typeData);
      }
      
      setShowModal(false);
      resetForm();
      loadLeaveTypes();
    } catch (err) {
      setError(err.message || 'Failed to save leave type');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      maxDays: '',
      carryForward: false,
      paid: true,
      requiresApproval: true
    });
    setEditingType(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave type?')) {
      return;
    }

    setLoading(true);
    try {
      await hrAPI.deleteLeaveType(id);
      loadLeaveTypes();
    } catch (err) {
      setError(err.message || 'Failed to delete leave type');
    } finally {
      setLoading(false);
    }
  };

  const filteredTypes = leaveTypes.filter(type => 
    type.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Leave Types</h1>
            <p className="text-primary-600 mt-1">Manage different types of leave policies</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-modern btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Leave Type</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Total Leave Types</p>
                <p className="text-xl font-bold text-primary-900 mt-1">{leaveTypes.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Requires Approval</p>
                <p className="text-xl font-bold text-primary-900 mt-1">
                  {leaveTypes.filter(type => type.requiresApproval).length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-50">
                <Tag className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Carry Forward</p>
                <p className="text-xl font-bold text-primary-900 mt-1">
                  {leaveTypes.filter(type => type.carryForward).length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <Tag className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="modern-card-elevated p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leave types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
        </div>

        {/* Leave Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full">
              <LoadingSpinner />
            </div>
          ) : filteredTypes.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No leave types found</p>
            </div>
          ) : (
            filteredTypes.map((type) => (
              <div key={type.id} className="modern-card-elevated p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Tag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-primary-900">{type.name}</h3>
                    </div>
                  </div>
                </div>
                
                <p className="text-primary-600 text-sm mb-4 line-clamp-2">
                  {type.description || 'No description provided'}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-600">Max Days:</span>
                    <span className="font-medium text-primary-900">
                      {type.maxDays || 'Unlimited'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-600">Requires Approval:</span>
                    <span className={`font-medium ${type.requiresApproval ? 'text-amber-600' : 'text-green-600'}`}>
                      {type.requiresApproval ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-600">Paid Leave:</span>
                    <span className={`font-medium ${type.paid ? 'text-green-600' : 'text-red-600'}`}>
                      {type.paid ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-600">Carry Forward:</span>
                    <span className={`font-medium ${type.carryForward ? 'text-green-600' : 'text-red-600'}`}>
                      {type.carryForward ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingType(type);
                      setFormData({
                        name: type.name || '',
                        description: type.description || '',
                        maxDays: type.maxDays?.toString() || '',
                        carryForward: type.carryForward || false,
                        paid: type.paid !== false,
                        requiresApproval: type.requiresApproval !== false
                      });
                      setShowModal(true);
                    }}
                    className="flex-1 btn-modern btn-secondary text-xs flex items-center justify-center space-x-1"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(type.id)}
                    className="flex-1 btn-modern bg-red-50 text-red-600 hover:bg-red-100 text-xs flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Leave Type Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="modern-card-elevated max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-primary-200">
              <h3 className="text-lg font-semibold text-primary-900">
                {editingType ? 'Edit Leave Type' : 'Add New Leave Type'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Name</label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-modern"
                  placeholder="e.g., Annual Leave, Sick Leave"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="input-modern"
                  placeholder="Describe this leave type..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Maximum Days (leave empty for unlimited)
                </label>
                <input
                  name="maxDays"
                  type="number"
                  min="1"
                  value={formData.maxDays}
                  onChange={handleChange}
                  className="input-modern"
                  placeholder="e.g., 30"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    name="requiresApproval"
                    type="checkbox"
                    checked={formData.requiresApproval}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-primary-700">
                    Requires approval
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    name="paid"
                    type="checkbox"
                    checked={formData.paid}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-primary-700">
                    Paid leave
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    name="carryForward"
                    type="checkbox"
                    checked={formData.carryForward}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-primary-700">
                    Can carry forward to next year
                  </label>
                </div>
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
                  {loading ? 'Saving...' : (editingType ? 'Update Type' : 'Add Type')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LeaveTypeList;