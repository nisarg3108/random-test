import React, { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Search, Edit, Trash2, FileText, Check, X, Package } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const statusStyles = {
  DRAFT: { label: 'Draft', color: 'text-gray-700', bg: 'bg-gray-100' },
  SENT: { label: 'Sent', color: 'text-blue-700', bg: 'bg-blue-100' },
  CONFIRMED: { label: 'Confirmed', color: 'text-purple-700', bg: 'bg-purple-100' },
  SHIPPED: { label: 'Shipped', color: 'text-amber-700', bg: 'bg-amber-100' },
  RECEIVED: { label: 'Received', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-100' }
};

const paymentStatusStyles = {
  UNPAID: { label: 'Unpaid', color: 'text-red-700', bg: 'bg-red-100' },
  PARTIAL: { label: 'Partial', color: 'text-amber-700', bg: 'bg-amber-100' },
  PAID: { label: 'Paid', color: 'text-emerald-700', bg: 'bg-emerald-100' }
};

const PurchaseOrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    vendorId: '',
    title: '',
    description: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    status: 'DRAFT',
    items: [{ itemName: '', description: '', quantity: 1, unitPrice: 0, unit: 'pcs', tax: 0, discount: 0 }],
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    shippingCost: 0,
    totalAmount: 0,
    paymentTerms: 'NET30',
    shippingAddress: '',
    notes: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchVendors();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/purchase/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (err) {
      setError('Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/purchase/vendors?status=ACTIVE`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(response.data);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    }
  };

  const calculateTotals = (items, shipping, discount) => {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
      return sum + itemTotal;
    }, 0);

    const taxAmount = items.reduce((sum, item) => {
      const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
      return sum + (itemTotal * (item.tax || 0) / 100);
    }, 0);

    const totalAmount = subtotal + taxAmount + (shipping || 0) - (discount || 0);

    return { subtotal, taxAmount, totalAmount };
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    const { subtotal, taxAmount, totalAmount } = calculateTotals(
      newItems,
      formData.shippingCost,
      formData.discountAmount
    );

    setFormData({
      ...formData,
      items: newItems,
      subtotal,
      taxAmount,
      totalAmount
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: '', description: '', quantity: 1, unitPrice: 0, unit: 'pcs', tax: 0, discount: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    const { subtotal, taxAmount, totalAmount } = calculateTotals(
      newItems,
      formData.shippingCost,
      formData.discountAmount
    );
    setFormData({ ...formData, items: newItems, subtotal, taxAmount, totalAmount });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      if (editing) {
        await axios.put(`${API_URL}/api/purchase/orders/${editing.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/purchase/orders`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setShowModal(false);
      resetForm();
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save purchase order');
    }
  };

  const resetForm = () => {
    setFormData({
      vendorId: '',
      title: '',
      description: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      status: 'DRAFT',
      items: [{ itemName: '', description: '', quantity: 1, unitPrice: 0, unit: 'pcs', tax: 0, discount: 0 }],
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      shippingCost: 0,
      totalAmount: 0,
      paymentTerms: 'NET30',
      shippingAddress: '',
      notes: ''
    });
    setEditing(null);
  };

  const handleEdit = (order) => {
    setEditing(order);
    setFormData({
      vendorId: order.vendorId || '',
      title: order.title || '',
      description: order.description || '',
      orderDate: order.orderDate ? order.orderDate.split('T')[0] : '',
      expectedDeliveryDate: order.expectedDeliveryDate ? order.expectedDeliveryDate.split('T')[0] : '',
      status: order.status || 'DRAFT',
      items: Array.isArray(order.items) && order.items.length > 0 ? order.items : [{ itemName: '', description: '', quantity: 1, unitPrice: 0, unit: 'pcs', tax: 0, discount: 0 }],
      subtotal: order.subtotal || 0,
      taxAmount: order.taxAmount || 0,
      discountAmount: order.discountAmount || 0,
      shippingCost: order.shippingCost || 0,
      totalAmount: order.totalAmount || 0,
      paymentTerms: order.paymentTerms || 'NET30',
      shippingAddress: order.shippingAddress || '',
      notes: order.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase order?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/purchase/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete purchase order');
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/purchase/orders/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
    } catch (err) {
      setError('Failed to approve purchase order');
    }
  };

  const filtered = orders.filter(o =>
    o.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: orders.length,
    draft: orders.filter(o => o.status === 'DRAFT').length,
    active: orders.filter(o => ['SENT', 'CONFIRMED', 'SHIPPED'].includes(o.status)).length,
    totalValue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Purchase Orders</h1>
            <p className="text-primary-600 mt-1">Manage purchase orders and procurement</p>
          </div>
          <button
            onClick={() => { setError(''); resetForm(); setShowModal(true); }}
            className="btn-modern btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Order</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Total POs</p>
                <p className="text-xl font-bold text-primary-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Draft</p>
                <p className="text-xl font-bold text-primary-900 mt-1">{stats.draft}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-50">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Active</p>
                <p className="text-xl font-bold text-primary-900 mt-1">{stats.active}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Total Value</p>
                <p className="text-xl font-bold text-primary-900 mt-1">${stats.totalValue.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="modern-card-elevated p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by PO number or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
        </div>

        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">Purchase Orders ({filtered.length})</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8"><LoadingSpinner /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No purchase orders found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">PO Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Payment</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-primary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-200">
                  {filtered.map((order) => (
                    <tr key={order.id} className="hover:bg-primary-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-primary-900">{order.poNumber}</td>
                      <td className="px-6 py-4 text-sm text-primary-600">{order.vendor?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-primary-900">{order.title}</td>
                      <td className="px-6 py-4 text-sm font-medium text-primary-900">${order.totalAmount?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[order.status]?.bg} ${statusStyles[order.status]?.color}`}>
                          {statusStyles[order.status]?.label || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${paymentStatusStyles[order.paymentStatus]?.bg} ${paymentStatusStyles[order.paymentStatus]?.color}`}>
                          {paymentStatusStyles[order.paymentStatus]?.label || order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm space-x-2">
                        {order.approvalStatus === 'PENDING' && (
                          <button
                            onClick={() => handleApprove(order.id)}
                            className="text-emerald-600 hover:text-emerald-800 inline-flex items-center"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(order)}
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="text-red-600 hover:text-red-800 inline-flex items-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full my-8">
            <div className="sticky top-0 bg-white border-b border-primary-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold text-primary-900">
                {editing ? 'Edit Purchase Order' : 'New Purchase Order'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-primary-400 hover:text-primary-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Vendor <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="vendorId"
                    value={formData.vendorId}
                    onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                    required
                    className="input-modern"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.vendorCode})</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Order Date</label>
                  <input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Expected Delivery</label>
                  <input
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Payment Terms</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="input-modern"
                  >
                    <option value="COD">Cash on Delivery</option>
                    <option value="NET15">Net 15</option>
                    <option value="NET30">Net 30</option>
                    <option value="NET60">Net 60</option>
                    <option value="NET90">Net 90</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-modern"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="RECEIVED">Received</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-primary-900">Items</h3>
                  <button type="button" onClick={addItem} className="btn-modern btn-secondary text-sm">
                    <Plus className="w-4 h-4 inline mr-1" /> Add Item
                  </button>
                </div>

                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-start">
                    <input
                      type="text"
                      placeholder="Item Name"
                      value={item.itemName}
                      onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                      className="col-span-3 input-modern"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      className="col-span-2 input-modern"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Unit"
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      className="col-span-2 input-modern"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                      className="col-span-2 input-modern"
                      required
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Tax %"
                      value={item.tax}
                      onChange={(e) => handleItemChange(index, 'tax', Number(e.target.value))}
                      className="col-span-2 input-modern"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="col-span-1 text-red-600 hover:text-red-800"
                      disabled={formData.items.length === 1}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Shipping Address</label>
                  <textarea
                    value={formData.shippingAddress}
                    onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                    rows="2"
                    className="input-modern"
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-primary-600">Subtotal:</span>
                    <span className="font-medium">${formData.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-primary-600">Tax:</span>
                    <span className="font-medium">${formData.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-primary-600">Shipping:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.shippingCost}
                      onChange={(e) => {
                        const shipping = Number(e.target.value) || 0;
                        const { totalAmount } = calculateTotals(formData.items, shipping, formData.discountAmount);
                        setFormData({ ...formData, shippingCost: shipping, totalAmount });
                      }}
                      className="w-24 input-modern text-right"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-primary-600">Discount:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.discountAmount}
                      onChange={(e) => {
                        const discount = Number(e.target.value) || 0;
                        const { totalAmount } = calculateTotals(formData.items, formData.shippingCost, discount);
                        setFormData({ ...formData, discountAmount: discount, totalAmount });
                      }}
                      className="w-24 input-modern text-right"
                    />
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>${formData.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-primary-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="2"
                    className="input-modern"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn-modern btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modern btn-primary">
                  {editing ? 'Update' : 'Create'} Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PurchaseOrdersList;
