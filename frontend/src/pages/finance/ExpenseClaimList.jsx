import React, { useEffect, useState } from 'react';
import { useFinanceStore } from '../../store/finance.store.js';
import { Plus, Receipt, Calendar, DollarSign, Filter } from 'lucide-react';
import Layout from '../../components/layout/Layout.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import Modal from '../../components/common/Modal.jsx';

const ExpenseClaimList = () => {
  const { 
    expenseClaims, 
    expenseCategories, 
    loading, 
    error, 
    fetchExpenseClaims, 
    fetchExpenseCategories,
    createExpenseClaim 
  } = useFinanceStore();
  
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    expenseDate: '',
    categoryId: '',
    receiptUrl: ''
  });

  useEffect(() => {
    fetchExpenseClaims();
    fetchExpenseCategories();
  }, [fetchExpenseClaims, fetchExpenseCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createExpenseClaim({
        ...formData,
        amount: parseFloat(formData.amount),
        expenseDate: new Date(formData.expenseDate).toISOString()
      });
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        amount: '',
        expenseDate: '',
        categoryId: '',
        receiptUrl: ''
      });
    } catch (error) {
      console.error('Failed to create expense claim:', error);
    }
  };

  const filteredClaims = expenseClaims.filter(claim => 
    statusFilter === 'ALL' || claim.status === statusFilter
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
            <h1 className="text-2xl font-bold text-primary-900">Expense Claims</h1>
            <p className="text-primary-600 mt-1">Submit and track your expense claims</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-modern btn-primary flex items-center gap-2 interactive-lift"
          >
            <Plus className="h-4 w-4" />
            New Claim
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="modern-card-elevated p-4">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-primary-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-modern"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Claims List */}
        <div className="space-y-4">
          {filteredClaims.map((claim) => (
            <div key={claim.id} className="modern-card-elevated p-6 interactive-lift">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-primary-900">{claim.title}</h3>
                    {claim.description && (
                      <p className="text-primary-600 mt-1">{claim.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-3 text-sm text-primary-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(claim.expenseDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        ${claim.amount}
                      </div>
                      {claim.category && (
                        <span className="bg-primary-100 px-2 py-1 rounded text-xs text-primary-700">
                          {claim.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                  {claim.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredClaims.length === 0 && !loading && (
          <div className="modern-card-elevated p-12 text-center">
            <Receipt className="h-12 w-12 text-primary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-primary-900 mb-2">No expense claims found</h3>
            <p className="text-primary-600 mb-4">Submit your first expense claim to get started</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-modern btn-primary"
            >
              New Claim
            </button>
          </div>
        )}

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Expense Claim">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-modern"
                placeholder="Brief description of the expense"
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
                placeholder="Detailed description of the expense"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input-modern"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Expense Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  className="input-modern"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="input-modern"
              >
                <option value="">Select a category</option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Receipt URL (Optional)
              </label>
              <input
                type="url"
                value={formData.receiptUrl}
                onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
                className="input-modern"
                placeholder="https://example.com/receipt.pdf"
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
                {loading ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default ExpenseClaimList;