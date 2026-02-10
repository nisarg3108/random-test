import React, { useState, useEffect } from 'react';
import { salesAPI } from '../../api/sales.api';

const PAYMENT_METHODS = [
  'CASH',
  'BANK_TRANSFER',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CHECK',
  'UPI',
  'OTHER'
];

const PaymentHistory = ({ invoice, onPaymentChange }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    referenceNumber: '',
    notes: ''
  });

  useEffect(() => {
    if (invoice?.id) {
      loadPayments();
    }
  }, [invoice?.id]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await salesAPI.getInvoicePayments(invoice.id);
      setPayments(response.data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      alert('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentModal = (payment = null) => {
    if (payment) {
      setEditingPayment(payment);
      setPaymentForm({
        amount: payment.amount,
        paymentDate: payment.paymentDate.split('T')[0],
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber || '',
        notes: payment.notes || ''
      });
    } else {
      setEditingPayment(null);
      setPaymentForm({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
        referenceNumber: '',
        notes: ''
      });
    }
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setEditingPayment(null);
    setPaymentForm({
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
      referenceNumber: '',
      notes: ''
    });
  };

  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      setLoading(true);
      const paymentData = {
        ...paymentForm,
        amount: parseFloat(paymentForm.amount)
      };

      if (editingPayment) {
        await salesAPI.updateInvoicePayment(editingPayment.id, paymentData);
      } else {
        await salesAPI.createInvoicePayment(invoice.id, paymentData);
      }

      await loadPayments();
      if (onPaymentChange) {
        onPaymentChange();
      }
      handleClosePaymentModal();
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    try {
      setLoading(true);
      await salesAPI.deleteInvoicePayment(paymentId);
      await loadPayments();
      if (onPaymentChange) {
        onPaymentChange();
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment');
    } finally {
      setLoading(false);
    }
  };

  const formatPaymentMethod = (method) => {
    return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
  const remainingAmount = (invoice?.total || 0) - totalPaid;

  return (
    <div className="space-y-4">
      {/* Payment Summary */}
      <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600">Invoice Total</p>
          <p className="text-lg font-semibold">${invoice?.total?.toFixed(2) || '0.00'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Paid</p>
          <p className="text-lg font-semibold text-green-600">${totalPaid.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Remaining</p>
          <p className={`text-lg font-semibold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            ${remainingAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Add Payment Button */}
      <div className="flex justify-end">
        <button
          onClick={() => handleOpenPaymentModal()}
          disabled={loading || remainingAmount <= 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Record Payment
        </button>
      </div>

      {/* Payment History Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && payments.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  Loading payments...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No payments recorded yet
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${parseFloat(payment.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPaymentMethod(payment.paymentMethod)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.referenceNumber || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {payment.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleOpenPaymentModal(payment)}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-900 disabled:text-gray-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePayment(payment.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingPayment ? 'Edit Payment' : 'Record Payment'}
            </h3>
            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={paymentForm.amount}
                  onChange={handlePaymentFormChange}
                  step="0.01"
                  min="0.01"
                  max={editingPayment ? undefined : remainingAmount}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {!editingPayment && (
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: ${remainingAmount.toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  name="paymentDate"
                  value={paymentForm.paymentDate}
                  onChange={handlePaymentFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  name="paymentMethod"
                  value={paymentForm.paymentMethod}
                  onChange={handlePaymentFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method} value={method}>
                      {formatPaymentMethod(method)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  name="referenceNumber"
                  value={paymentForm.referenceNumber}
                  onChange={handlePaymentFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Check #1234, Transaction ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={paymentForm.notes}
                  onChange={handlePaymentFormChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional payment details..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClosePaymentModal}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Saving...' : editingPayment ? 'Update Payment' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
