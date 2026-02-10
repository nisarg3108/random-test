import React, { useEffect, useState } from 'react';
import { FileText, Plus, Search, Edit, Trash2, CheckCircle, XCircle, DollarSign, Calendar, AlertTriangle, Upload, Paperclip, X } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import axios from 'axios';
import { getToken } from '../../store/auth.store';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const statusStyles = {
  PENDING: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  APPROVED: { label: 'Approved', color: 'text-blue-700', bg: 'bg-blue-100' },
  PARTIALLY_PAID: { label: 'Partially Paid', color: 'text-orange-700', bg: 'bg-orange-100' },
  PAID: { label: 'Paid', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  OVERDUE: { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-700', bg: 'bg-gray-100' }
};

const approvalStatusStyles = {
  PENDING: { label: 'Pending', color: 'text-gray-700', bg: 'bg-gray-100' },
  APPROVED: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100' }
};

const BillsList = () => {
  const [bills, setBills] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [showOverdue, setShowOverdue] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [uploadingFile, setUploadingFile] = useState(null);

  const [formData, setFormData] = useState({
    vendorId: '',
    purchaseOrderId: '',
    billNumber: '',
    invoiceNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    shippingCost: 0,
    totalAmount: 0,
    items: [],
    notes: '',
    terms: ''
  });

  useEffect(() => {
    fetchBills();
    fetchVendors();
    fetchPurchaseOrders();
  }, [filterStatus, filterVendor, showOverdue, pagination.page]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterVendor) params.append('vendorId', filterVendor);
      if (showOverdue) params.append('overdue', 'true');
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);

      const response = await axios.get(`${API_URL}/api/ap/bills?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle paginated response
      if (response.data.data) {
        setBills(response.data.data);
        setPagination(prev => ({ ...prev, ...response.data.pagination }));
      } else {
        // Fallback for non-paginated response
        setBills(response.data);
      }
    } catch (err) {
      setError('Failed to fetch bills');
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

  const fetchPurchaseOrders = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/api/purchase/orders?status=RECEIVED`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPurchaseOrders(response.data);
    } catch (err) {
      console.error('Failed to fetch purchase orders:', err);
    }
  };

  const handlePOSelection = async (poId) => {
    if (!poId) {
      setFormData({ ...formData, purchaseOrderId: '', items: [] });
      return;
    }

    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/api/purchase/orders/${poId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const po = response.data;
      const items = po.items.map(item => ({
        description: item.description || item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice
      }));

      setFormData({
        ...formData,
        vendorId: po.vendorId,
        purchaseOrderId: poId,
        items,
        subtotal: po.subtotal || po.totalAmount,
        totalAmount: po.totalAmount
      });
    } catch (err) {
      console.error('Failed to fetch PO details:', err);
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const total = subtotal + formData.taxAmount - formData.discountAmount + formData.shippingCost;
    
    setFormData({
      ...formData,
      subtotal: subtotal,
      totalAmount: total
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
    }

    setFormData({ ...formData, items: newItems });
    setTimeout(calculateTotals, 10);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
    setTimeout(calculateTotals, 10);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();

    try {
      if (editing) {
        await axios.put(`${API_URL}/api/ap/bills/${editing.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/ap/bills`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setShowModal(false);
      resetForm();
      fetchBills();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save bill');
    }
  };

  const handleEdit = (bill) => {
    setEditing(bill);
    setFormData({
      vendorId: bill.vendorId,
      purchaseOrderId: bill.purchaseOrderId || '',
      billNumber: bill.billNumber,
      invoiceNumber: bill.invoiceNumber || '',
      billDate: bill.billDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      dueDate: bill.dueDate?.split('T')[0] || '',
      subtotal: bill.subtotal || 0,
      taxAmount: bill.taxAmount || 0,
      discountAmount: bill.discountAmount || 0,
      shippingCost: bill.shippingCost || 0,
      totalAmount: bill.totalAmount || 0,
      items: bill.items || [],
      notes: bill.notes || '',
      terms: bill.terms || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;

    try {
      const token = getToken();
      await axios.delete(`${API_URL}/api/ap/bills/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBills();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete bill');
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = getToken();
      await axios.post(`${API_URL}/api/ap/bills/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBills();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve bill');
    }
  };

  const handleFileUpload = async (billId, file) => {
    try {
      setUploadingFile(billId);
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);

      await axios.post(`${API_URL}/api/ap/bills/${billId}/attachments`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      fetchBills();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploadingFile(null);
    }
  };

  const handleDeleteAttachment = async (billId, attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;

    try {
      const token = getToken();
      await axios.delete(`${API_URL}/api/ap/bills/${billId}/attachments/${attachmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBills();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete attachment');
    }
  };

  const handleThreeWayMatch = async (id) => {
    try {
      const token = getToken();
      const response = await axios.post(`${API_URL}/api/ap/bills/${id}/match`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(response.data.message);
      fetchBills();
    } catch (err) {
      alert(err.response?.data?.error || 'Three-way match failed');
    }
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      vendorId: '',
      purchaseOrderId: '',
      billNumber: '',
      invoiceNumber: '',
      billDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      shippingCost: 0,
      totalAmount: 0,
      items: [],
      notes: '',
      terms: ''
    });
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate summary stats
  const stats = {
    total: bills.length,
    totalAmount: bills.reduce((sum, b) => sum + b.totalAmount, 0),
    outstanding: bills.filter(b => ['PENDING', 'APPROVED', 'PARTIALLY_PAID'].includes(b.status))
                      .reduce((sum, b) => sum + b.balanceAmount, 0),
    overdue: bills.filter(b => b.status === 'OVERDUE').length
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-8 h-8" />
              AP Bills
            </h1>
            <p className="text-gray-600 mt-1">Manage accounts payable invoices and bills</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            New Bill
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Bills</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
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
                <p className="text-gray-500 text-sm">Outstanding</p>
                <p className="text-2xl font-bold text-orange-600">${stats.outstanding.toFixed(2)}</p>
              </div>
              <Calendar className="w-10 h-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Overdue Bills</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search bills..."
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
              <option value="APPROVED">Approved</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
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

            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={showOverdue}
                onChange={(e) => setShowOverdue(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span>Show Overdue Only</span>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Bills Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Files</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">3-Way Match</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-12 text-center text-gray-500">
                      No bills found
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bill.billNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {bill.vendor?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {bill.invoiceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(bill.billDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(bill.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${bill.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600">
                        ${bill.balanceAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[bill.status].bg} ${statusStyles[bill.status].color}`}>
                          {statusStyles[bill.status].label}
                        </span>
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
                                  handleFileUpload(bill.id, e.target.files[0]);
                                  e.target.value = '';
                                }
                              }}
                              disabled={uploadingFile === bill.id}
                            />
                            {uploadingFile === bill.id ? (
                              <span className="text-xs text-gray-500">Uploading...</span>
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                          </label>
                          {bill.attachments && bill.attachments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="w-4 h-4 text-gray-500" />
                              <span className="text-xs text-gray-600">{bill.attachments.length}</span>
                              <div className="relative group">
                                <span className="text-xs text-blue-600 cursor-pointer">View</span>
                                <div className="hidden group-hover:block absolute z-10 bg-white shadow-lg rounded-lg p-2 min-w-[200px] right-0 top-full mt-1">
                                  {bill.attachments.map(att => (
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
                                        onClick={() => handleDeleteAttachment(bill.id, att.id)}
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
                        {bill.purchaseOrderId ? (
                          bill.threeWayMatched ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500" title="Matched" />
                          ) : (
                            <button
                              onClick={() => handleThreeWayMatch(bill.id)}
                              className="text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                              Match
                            </button>
                          )
                        ) : (
                          <span className="text-gray-400 text-xs">No PO</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {bill.approvalStatus === 'PENDING' && (
                            <button
                              onClick={() => handleApprove(bill.id)}
                              className="text-emerald-600 hover:text-emerald-800"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(bill)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(bill.id)}
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
                    <span className="font-medium">{pagination.totalPages}</span> ({pagination.total} total bills)
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
                  {editing ? 'Edit Bill' : 'New Bill'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
                      <select
                        value={formData.vendorId}
                        onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order (Optional)</label>
                      <select
                        value={formData.purchaseOrderId}
                        onChange={(e) => handlePOSelection(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">No PO</option>
                        {purchaseOrders.map(po => (
                          <option key={po.id} value={po.id}>{po.orderNumber} - ${po.totalAmount}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label>
                      <input
                        type="text"
                        value={formData.invoiceNumber}
                        onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bill Date *</label>
                      <input
                        type="date"
                        value={formData.billDate}
                        onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                      <input
                        type="text"
                        value={formData.terms}
                        onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Net 30"
                      />
                    </div>
                  </div>

                  {/* Line Items */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Line Items</label>
                      <button
                        type="button"
                        onClick={addItem}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Add Item
                      </button>
                    </div>

                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Unit Price</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                            <th className="px-3 py-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.items.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded"
                                  placeholder="Item description"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded"
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <span className="font-semibold">${item.amount.toFixed(2)}</span>
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="4"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="font-semibold">${formData.subtotal.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tax:</span>
                        <input
                          type="number"
                          value={formData.taxAmount}
                          onChange={(e) => setFormData({ ...formData, taxAmount: parseFloat(e.target.value) || 0 })}
                          onBlur={calculateTotals}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Discount:</span>
                        <input
                          type="number"
                          value={formData.discountAmount}
                          onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                          onBlur={calculateTotals}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Shipping:</span>
                        <input
                          type="number"
                          value={formData.shippingCost}
                          onChange={(e) => setFormData({ ...formData, shippingCost: parseFloat(e.target.value) || 0 })}
                          onBlur={calculateTotals}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="flex justify-between border-t pt-2">
                        <span className="text-lg font-bold text-gray-900">Total:</span>
                        <span className="text-lg font-bold text-gray-900">${formData.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
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
                      {editing ? 'Update Bill' : 'Create Bill'}
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

export default BillsList;
