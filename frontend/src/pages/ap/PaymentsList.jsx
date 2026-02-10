import React, { useEffect, useState } from 'react';
import { DollarSign, Plus, Search, Edit, Trash2, FileText, Upload, Paperclip, X } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import axios from 'axios';
import { getToken } from '../../store/auth.store';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const statusStyles = {
  PENDING: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  CLEARED: { label: 'Cleared', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  RETURNED: { label: 'Returned', color: 'text-red-700', bg: 'bg-red-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-700', bg: 'bg-gray-100' },
  SCHEDULED: { label: 'Scheduled', color: 'text-blue-700', bg: 'bg-blue-100' }
};

const PaymentsList = () => {
  const [payments, setPayments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [uploadingFile, setUploadingFile] = useState(null);

  const [formData, setFormData] = useState({
    vendorId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 'CHECK',
    referenceNumber: '',
    bankAccount: '',
    notes: '',
    allocations: []
  });

  useEffect(() => {
    fetchPayments();
    fetchVendors();
  }, [filterStatus, filterVendor, pagination.page]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterVendor) params.append('vendorId', filterVendor);
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);

      const response = await axios.get(`${API_URL}/api/ap/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle paginated response
      if (response.data.data) {
        setPayments(response.data.data);
        setPagination(prev => ({ ...prev, ...response.data.pagination }));
      } else {
        // Fallback for non-paginated response
        setPayments(response.data);
      }
    } catch (err) {
      setError('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/api/purchase/vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(response.data);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    }
  };

  const fetchVendorBills = async (vendorId) => {
    if (!vendorId) {
      setBills([]);
      return;
    }

    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/api/ap/bills?vendorId=${vendorId}&status=PENDING&status=APPROVED&status=PARTIALLY_PAID`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBills(response.data.filter(b => b.balanceAmount > 0));
    } catch (err) {
      console.error('Failed to fetch vendor bills:', err);
    }
  };

  const handleVendorChange = (vendorId) => {
    setFormData({ ...formData, vendorId, allocations: [] });
    fetchVendorBills(vendorId);
  };

  const handleAllocationChange = (billId, allocatedAmount) => {
    const existingAllocation = formData.allocations.find(a => a.billId === billId);
    
    if (allocatedAmount === 0 || allocatedAmount === '') {
      // Remove allocation
      setFormData({
        ...formData,
        allocations: formData.allocations.filter(a => a.billId !== billId)
      });
    } else {
      if (existingAllocation) {
        // Update existing allocation
        setFormData({
          ...formData,
          allocations: formData.allocations.map(a => 
            a.billId === billId ? { ...a, allocatedAmount: parseFloat(allocatedAmount) } : a
          )
        });
      } else {
        // Add new allocation
        setFormData({
          ...formData,
          allocations: [...formData.allocations, { billId, allocatedAmount: parseFloat(allocatedAmount) }]
        });
      }
    }
  };

  const calculateTotalAllocated = () => {
    return formData.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();

    const totalAllocated = calculateTotalAllocated();
    if (totalAllocated > formData.amount) {
      setError('Total allocated amount cannot exceed payment amount');
      return;
    }

    try {
      if (editing) {
        await axios.put(`${API_URL}/api/ap/payments/${editing.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/ap/payments`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setShowModal(false);
      resetForm();
      fetchPayments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save payment');
    }
  };

  const handleEdit = (payment) => {
    setEditing(payment);
    setFormData({
      vendorId: payment.vendorId,
      paymentDate: payment.paymentDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      amount: payment.amount || 0,
      paymentMethod: payment.paymentMethod || 'CHECK',
      referenceNumber: payment.referenceNumber || '',
      bankAccount: payment.bankAccount || '',
      notes: payment.notes || '',
      allocations: payment.allocations || []
    });
    fetchVendorBills(payment.vendorId);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;

    try {
      const token = getToken();
      await axios.delete(`${API_URL}/api/ap/payments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPayments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete payment');
    }
  };

  const handleFileUpload = async (paymentId, file) => {
    try {
      setUploadingFile(paymentId);
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);

      await axios.post(`${API_URL}/api/ap/payments/${paymentId}/attachments`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      fetchPayments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploadingFile(null);
    }
  };

  const handleDeleteAttachment = async (paymentId, attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;

    try {
      const token = getToken();
      await axios.delete(`${API_URL}/api/ap/payments/${paymentId}/attachments/${attachmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPayments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete attachment');
    }
  };

  const resetForm = () => {
    setEditing(null);
    setBills([]);
    setFormData({
      vendorId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: 'CHECK',
      referenceNumber: '',
      bankAccount: '',
      notes: '',
      allocations: []
    });
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.paymentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate summary stats
  const stats = {
    total: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    pending: payments.filter(p => p.status === 'PENDING').length,
    cleared: payments.filter(p => p.status === 'CLEARED').length
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <DollarSign className="w-8 h-8" />
              Payments
            </h1>
            <p className="text-gray-600 mt-1">Manage vendor payments and bill allocations</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            New Payment
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Payments</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Amount</p>
                <p className="text-2xl font-bold text-gray-800">${stats.totalAmount.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <FileText className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Cleared</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.cleared}</p>
              </div>
              <FileText className="w-10 h-10 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CLEARED">Cleared</option>
              <option value="RETURNED">Returned</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="SCHEDULED">Scheduled</option>
            </select>

            <select
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Vendors</option>
              {vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Files</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.paymentNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {payment.vendor?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${payment.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {payment.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {payment.referenceNumber || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer text-blue-600 hover:text-blue-800" title="Upload attachment">
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  handleFileUpload(payment.id, e.target.files[0]);
                                  e.target.value = '';
                                }
                              }}
                              disabled={uploadingFile === payment.id}
                            />
                            {uploadingFile === payment.id ? (
                              <span className="text-xs text-gray-500">Uploading...</span>
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                          </label>
                          {payment.attachments && payment.attachments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="w-4 h-4 text-gray-500" />
                              <span className="text-xs text-gray-600">{payment.attachments.length}</span>
                              <div className="relative group">
                                <span className="text-xs text-blue-600 cursor-pointer">View</span>
                                <div className="hidden group-hover:block absolute z-10 bg-white shadow-lg rounded-lg p-2 min-w-[200px] right-0 top-full mt-1">
                                  {payment.attachments.map(att => (
                                    <div key={att.id} className="flex items-center justify-between gap-2 py-1 hover:bg-gray-50 px-2 rounded">
                                      <a
                                        href={`${API_URL}/uploads/ap-attachments/${att.filename}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline truncate flex-1"
                                      >
                                        {att.originalName}
                                      </a>
                                      <button
                                        onClick={() => handleDeleteAttachment(payment.id, att.id)}
                                        className="text-red-600 hover:text-red-800"
                                        title="Delete"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[payment.status].bg} ${statusStyles[payment.status].color}`}>
                          {statusStyles[payment.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(payment)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(payment.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                    <span className="font-medium">{pagination.totalPages}</span> ({pagination.total} total payments)
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === pagination.page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {editing ? 'Edit Payment' : 'New Payment'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
                      <select
                        value={formData.vendorId}
                        onChange={(e) => handleVendorChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Vendor</option>
                        {vendors.map(vendor => (
                          <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                      <input
                        type="date"
                        value={formData.paymentDate}
                        onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount *</label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="CHECK">Check</option>
                        <option value="WIRE">Wire Transfer</option>
                        <option value="ACH">ACH</option>
                        <option value="CREDIT_CARD">Credit Card</option>
                        <option value="CASH">Cash</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                      <input
                        type="text"
                        value={formData.referenceNumber}
                        onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Check #, Transaction ID, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                      <input
                        type="text"
                        value={formData.bankAccount}
                        onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Account used for payment"
                      />
                    </div>
                  </div>

                  {/* Bill Allocations */}
                  {formData.vendorId && bills.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Allocate to Bills</label>
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Bill #</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Invoice #</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Due Date</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Balance</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Allocate Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bills.map((bill) => (
                              <tr key={bill.id} className="border-t">
                                <td className="px-3 py-2 text-sm">{bill.billNumber}</td>
                                <td className="px-3 py-2 text-sm">{bill.invoiceNumber}</td>
                                <td className="px-3 py-2 text-sm">{new Date(bill.dueDate).toLocaleDateString()}</td>
                                <td className="px-3 py-2 text-sm font-semibold">${bill.balanceAmount.toFixed(2)}</td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={formData.allocations.find(a => a.billId === bill.id)?.allocatedAmount || ''}
                                    onChange={(e) => handleAllocationChange(bill.id, e.target.value)}
                                    className="w-32 px-2 py-1 border border-gray-300 rounded"
                                    min="0"
                                    max={bill.balanceAmount}
                                    step="0.01"
                                    placeholder="0.00"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-600">Total Allocated:</span>
                        <span className="font-semibold">${calculateTotalAllocated().toFixed(2)} / ${formData.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Additional payment notes..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); resetForm(); }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editing ? 'Update Payment' : 'Create Payment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PaymentsList;
