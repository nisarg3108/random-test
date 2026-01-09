import React, { useEffect, useState } from 'react';
import { useSystemOptionsStore } from '../store/systemOptions.store';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { RoleGuard } from '../hooks/useAuth';
import { Plus, Edit, Trash2 } from 'lucide-react';

const SystemOptions = () => {
  const { options, loading, error, fetchOptions, createOption, updateOption, deleteOption } = useSystemOptionsStore();
  const [selectedCategory, setSelectedCategory] = useState('INDUSTRY');
  const [showModal, setShowModal] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [formData, setFormData] = useState({
    category: 'INDUSTRY',
    key: '',
    value: '',
    label: ''
  });

  const categories = [
    { key: 'INDUSTRY', label: 'Industry Types' },
    { key: 'COMPANY_SIZE', label: 'Company Sizes' },
    { key: 'CURRENCY', label: 'Currencies' },
    { key: 'USER_STATUS', label: 'User Status' },
    { key: 'USER_ROLE', label: 'User Roles' }
  ];

  useEffect(() => {
    loadCategoryOptions();
  }, [selectedCategory]);

  const loadCategoryOptions = async () => {
    await fetchOptions(selectedCategory);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = editingOption 
      ? await updateOption(editingOption.id, formData)
      : await createOption(formData);
    
    if (success) {
      setShowModal(false);
      setEditingOption(null);
      setFormData({ category: selectedCategory, key: '', value: '', label: '' });
    }
  };

  const handleEdit = (option) => {
    setEditingOption(option);
    setFormData({
      category: option.category,
      key: option.key,
      value: option.value,
      label: option.label
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this option?')) {
      await deleteOption(id, selectedCategory);
    }
  };

  const currentOptions = options[selectedCategory] || [];

  return (
    <RoleGuard requiredRole="ADMIN" fallback={
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
                <h1 className="text-3xl font-bold text-gray-900">System Options</h1>
                <p className="text-gray-600 mt-1">Manage dynamic dropdown options</p>
              </div>
              <button
                onClick={() => {
                  setFormData({ category: selectedCategory, key: '', value: '', label: '' });
                  setEditingOption(null);
                  setShowModal(true);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Plus size={20} />
                Add Option
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {categories.map((category) => (
                    <button
                      key={category.key}
                      onClick={() => setSelectedCategory(category.key)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        selectedCategory === category.key
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentOptions.map((option) => (
                          <tr key={option.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{option.key}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.value}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{option.label}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleEdit(option)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(option.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingOption ? 'Edit Option' : 'Add New Option'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Key</label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {editingOption ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleGuard>
  );
};

export default SystemOptions;