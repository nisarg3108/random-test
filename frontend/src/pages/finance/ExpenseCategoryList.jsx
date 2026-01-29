import React, { useEffect, useState } from 'react';
import { useFinanceStore } from '../../store/finance.store.js';
import { Plus, Tag } from 'lucide-react';
import Layout from '../../components/layout/Layout.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import Modal from '../../components/common/Modal.jsx';

const ExpenseCategoryList = () => {
  const { expenseCategories, loading, error, fetchExpenseCategories, createExpenseCategory } = useFinanceStore();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxAmount: ''
  });

  useEffect(() => {
    fetchExpenseCategories();
  }, [fetchExpenseCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createExpenseCategory({
        name: formData.name
      });
      setShowModal(false);
      setFormData({ name: '', description: '', maxAmount: '' });
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Expense Categories</h1>
            <p className="text-primary-600 mt-1">Manage expense categories for claims</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-modern btn-primary flex items-center gap-2 interactive-lift"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expenseCategories.map((category) => (
            <div key={category.id} className="modern-card-elevated p-6 interactive-lift">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Tag className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-primary-900">{category.name}</h3>
                    <p className="text-sm text-primary-600 mt-1">Code: {category.code}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-primary-200">
                <p className="text-sm text-primary-600">
                  Status: <span className="font-medium text-primary-900">{category.active ? 'Active' : 'Inactive'}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {expenseCategories.length === 0 && !loading && (
          <div className="modern-card-elevated p-12 text-center">
            <Tag className="h-12 w-12 text-primary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-primary-900 mb-2">No categories found</h3>
            <p className="text-primary-600 mb-4">Create your first expense category to get started</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-modern btn-primary"
            >
              Add Category
            </button>
          </div>
        )}

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Expense Category">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-modern"
                placeholder="e.g., Travel, Meals, Office Supplies"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-modern"
                rows="3"
                placeholder="Brief description of this category (for reference only)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Maximum Amount (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.maxAmount}
                onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                className="input-modern"
                placeholder="0.00 (for reference only)"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-modern btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-modern btn-primary disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default ExpenseCategoryList;