import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, Edit, Trash2, FileText, CheckCircle, XCircle } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const qualityStatusStyles = {
  PENDING: { label: 'Pending', color: 'text-gray-700', bg: 'bg-gray-100' },
  PASSED: { label: 'Passed', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  FAILED: { label: 'Failed', color: 'text-red-700', bg: 'bg-red-100' },
  PARTIAL: { label: 'Partial', color: 'text-amber-700', bg: 'bg-amber-100' }
};

const GoodsReceiptList = () => {
  const [receipts, setReceipts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPO, setSelectedPO] = useState(null);
  
  const [formData, setFormData] = useState({
    purchaseOrderId: '',
    receiptDate: new Date().toISOString().split('T')[0],
    receivedBy: '',
    items: [],
    qualityStatus: 'PENDING',
    notes: '',
    inspectionNotes: ''
  });

  useEffect(() => {
    fetchReceipts();
    fetchPurchaseOrders();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ueorms_token');
      const response = await axios.get(`${API_URL}/api/purchase/receipts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReceipts(response.data);
    } catch (err) {
      setError('Failed to fetch goods receipts');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const token = localStorage.getItem('ueorms_token');
      const response = await axios.get(`${API_URL}/api/purchase/orders?status=CONFIRMED&status=SHIPPED`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPurchaseOrders(response.data);
    } catch (err) {
      console.error('Failed to fetch purchase orders:', err);
    }
  };

  const handlePOSelection = async (poId) => {
    if (!poId) {
      setSelectedPO(null);
      setFormData({
        ...formData,
        purchaseOrderId: '',
        items: []
      });
      return;
    }

    try {
      const token = localStorage.getItem('ueorms_token');
      const response = await axios.get(`${API_URL}/api/purchase/orders/${poId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const po = response.data;
      setSelectedPO(po);

      // Initialize items from PO
      const items = po.items.map(item => ({
        itemName: item.itemName,
        description: item.description || '',
        orderedQuantity: item.quantity,
        receivedQuantity: 0,
        unit: item.unit || 'pcs',
        remarks: ''
      }));

      setFormData({
        ...formData,
        purchaseOrderId: poId,
        items
      });
    } catch (err) {
      console.error('Failed to fetch PO details:', err);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('ueorms_token');

    try {
      if (editing) {
        await axios.put(`${API_URL}/api/purchase/receipts/${editing.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/purchase/receipts`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setShowModal(false);
      resetForm();
      fetchReceipts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save goods receipt');
    }
  };

  const handleEdit = (receipt) => {
    setEditing(receipt);
    setFormData({
      purchaseOrderId: receipt.purchaseOrderId,
      receiptDate: receipt.receiptDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      receivedBy: receipt.receivedBy || '',
      items: receipt.items || [],
      qualityStatus: receipt.qualityStatus,
      notes: receipt.notes || '',
      inspectionNotes: receipt.inspectionNotes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this goods receipt?')) return;
    
    try {
      const token = localStorage.getItem('ueorms_token');
      await axios.delete(`${API_URL}/api/purchase/receipts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchReceipts();
    } catch (err) {
      setError('Failed to delete goods receipt');
    }
  };

  const resetForm = () => {
    setFormData({
      purchaseOrderId: '',
      receiptDate: new Date().toISOString().split('T')[0],
      receivedBy: '',
      items: [],
      qualityStatus: 'PENDING',
      notes: '',
      inspectionNotes: ''
    });
    setEditing(null);
    setSelectedPO(null);
  };

  const filteredReceipts = receipts.filter(receipt =>
    receipt.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.purchaseOrder?.poNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: receipts.length,
    pending: receipts.filter(r => r.qualityStatus === 'PENDING').length,
    passed: receipts.filter(r => r.qualityStatus === 'PASSED').length,
    failed: receipts.filter(r => r.qualityStatus === 'FAILED').length
  };

  if (loading && receipts.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Goods Receipts</h1>
              <p className="text-sm text-gray-500">Manage incoming inventory receipts</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Receipt
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Receipts</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Pending Inspection</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Quality Passed</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.passed}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Quality Failed</p>
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by receipt number or PO number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Receipts Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Received By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReceipts.map((receipt) => {
                  const statusStyle = qualityStatusStyles[receipt.qualityStatus] || qualityStatusStyles.PENDING;
                  return (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-gray-900">{receipt.receiptNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{receipt.purchaseOrder?.poNumber || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {new Date(receipt.receiptDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{receipt.receivedBy || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyle.bg} ${statusStyle.color}`}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{receipt.items?.length || 0} items</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(receipt)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(receipt.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredReceipts.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No goods receipts found</p>
                      <p className="text-sm">Create your first goods receipt to get started</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editing ? 'Edit Goods Receipt' : 'New Goods Receipt'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Purchase Order <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.purchaseOrderId}
                        onChange={(e) => handlePOSelection(e.target.value)}
                        disabled={editing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="">Select Purchase Order</option>
                        {purchaseOrders.map((po) => (
                          <option key={po.id} value={po.id}>
                            {po.poNumber} - {po.vendor?.name} - ${po.totalAmount}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Receipt Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.receiptDate}
                        onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Received By
                      </label>
                      <input
                        type="text"
                        value={formData.receivedBy}
                        onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter receiver name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quality Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.qualityStatus}
                        onChange={(e) => setFormData({ ...formData, qualityStatus: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PASSED">Passed</option>
                        <option value="FAILED">Failed</option>
                        <option value="PARTIAL">Partial</option>
                      </select>
                    </div>
                  </div>

                  {/* Items Section */}
                  {formData.items.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Receipt Items</h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordered</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {formData.items.map((item, index) => (
                              <tr key={index}>
                                <td className="px-4 py-3">
                                  <div>
                                    <div className="font-medium text-gray-900">{item.itemName}</div>
                                    {item.description && (
                                      <div className="text-sm text-gray-500">{item.description}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-sm text-gray-900">{item.orderedQuantity}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    min="0"
                                    max={item.orderedQuantity}
                                    value={item.receivedQuantity}
                                    onChange={(e) => handleItemChange(index, 'receivedQuantity', parseFloat(e.target.value) || 0)}
                                    className="w-24 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-sm text-gray-600">{item.unit}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="text"
                                    value={item.remarks || ''}
                                    onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                                    className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Any remarks..."
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inspection Notes
                      </label>
                      <textarea
                        value={formData.inspectionNotes}
                        onChange={(e) => setFormData({ ...formData, inspectionNotes: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Quality inspection notes..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        General Notes
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {editing ? 'Update Receipt' : 'Create Receipt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GoodsReceiptList;
