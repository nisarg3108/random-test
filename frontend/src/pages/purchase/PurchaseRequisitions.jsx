import React, { useEffect, useState } from 'react';
import { FileText, Plus, Search, Edit, Trash2, Check, X, ShoppingCart } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const PurchaseRequisitions = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    vendorId: '',
    requiredDate: '',
    priority: 'MEDIUM',
    items: [{ itemName: '', description: '', quantity: 1, estimatedPrice: 0, unit: 'pcs' }],
    totalAmount: 0,
    notes: ''
  });

  useEffect(() => {
    fetchRequisitions();
    fetchVendors();
  }, []);

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ueorms_token');
      const response = await axios.get(`${API_URL}/api/purchase/requisitions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequisitions(response.data);
    } catch (err) {
      setError('Failed to fetch requisitions');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('ueorms_token');
      const response = await axios.get(`${API_URL}/api/purchase/vendors?status=ACTIVE`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(response.data);
    } catch (err) {
      console.error('Failed to fetch vendors');
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    const totalAmount = newItems.reduce((sum, item) => {
      return sum + ((item.quantity || 0) * (item.estimatedPrice || 0));
    }, 0);

    setFormData({ ...formData, items: newItems, totalAmount });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: '', description: '', quantity: 1, estimatedPrice: 0, unit: 'pcs' }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    const totalAmount = newItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.estimatedPrice || 0)), 0);
    setFormData({ ...formData, items: newItems, totalAmount });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('ueorms_token');

    try {
      if (editing) {
        await axios.put(`${API_URL}/api/purchase/requisitions/${editing.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/purchase/requisitions`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setShowModal(false);
      resetForm();
      fetchRequisitions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save requisition');
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('ueorms_token');
      await axios.post(`${API_URL}/api/purchase/requisitions/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRequisitions();
    } catch (err) {
      setError('Failed to approve requisition');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('ueorms_token');
      await axios.post(`${API_URL}/api/purchase/requisitions/${id}/reject`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRequisitions();
    } catch (err) {
      setError('Failed to reject requisition');
    }
  };

  const handleConvertToPO = async (id) => {
    if (!window.confirm('Convert this requisition to a purchase order?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('ueorms_token');
      await axios.post(`${API_URL}/api/purchase/requisitions/${id}/convert-to-po`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRequisitions();
      alert('Successfully converted to purchase order!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to convert requisition to purchase order');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this requisition?')) return;
    
    try {
      const token = localStorage.getItem('ueorms_token');
      await axios.delete(`${API_URL}/api/purchase/requisitions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRequisitions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete requisition');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      vendorId: '',
      requiredDate: '',
      priority: 'MEDIUM',
      items: [{ itemName: '', description: '', quantity: 1, estimatedPrice: 0, unit: 'pcs' }],
      totalAmount: 0,
      notes: ''
    });
    setEditing(null);
  };

  const handleEdit = (req) => {
    setEditing(req);
    setFormData({
      title: req.title || '',
      description: req.description || '',
      vendorId: req.vendorId || '',
      requiredDate: req.requiredDate ? req.requiredDate.split('T')[0] : '',
      priority: req.priority || 'MEDIUM',
      items: Array.isArray(req.items) && req.items.length > 0 ? req.items : [{ itemName: '', description: '', quantity: 1, estimatedPrice: 0, unit: 'pcs' }],
      totalAmount: req.totalAmount || 0,
      notes: req.notes || ''
    });
    setShowModal(true);
  };

  const filtered = requisitions.filter(r =>
    r.requisitionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const priorityStyles = {
    LOW: { color: 'text-blue-700', bg: 'bg-blue-100' },
    MEDIUM: { color: 'text-amber-700', bg: 'bg-amber-100' },
    HIGH: { color: 'text-orange-700', bg: 'bg-orange-100' },
    URGENT: { color: 'text-red-700', bg: 'bg-red-100' }
  };

  const statusStyles = {
    PENDING: { color: 'text-amber-700', bg: 'bg-amber-100' },
    APPROVED: { color: 'text-emerald-700', bg: 'bg-emerald-100' },
    REJECTED: { color: 'text-red-700', bg: 'bg-red-100' },
    CONVERTED: { color: 'text-purple-700', bg: 'bg-purple-100' }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Purchase Requisitions</h1>
            <p className="text-primary-600 mt-1">Manage purchase requests and approvals</p>
          </div>
          <button onClick={() => { setError(''); resetForm(); setShowModal(true); }} className="btn-modern btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Requisition</span>
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        <div className="modern-card-elevated p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search requisitions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-modern pl-10" />
          </div>
        </div>

        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">Requisitions ({filtered.length})</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8"><LoadingSpinner /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No requisitions found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-primary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-200">
                  {filtered.map((req) => (
                    <tr key={req.id} className="hover:bg-primary-50">
                      <td className="px-6 py-4 text-sm font-medium">{req.requisitionNumber}</td>
                      <td className="px-6 py-4 text-sm">{req.title}</td>
                      <td className="px-6 py-4 text-sm">{req.vendor?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm font-medium">${req.totalAmount?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityStyles[req.priority]?.bg} ${priorityStyles[req.priority]?.color}`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[req.approvalStatus]?.bg} ${statusStyles[req.approvalStatus]?.color}`}>
                          {req.approvalStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {req.approvalStatus === 'PENDING' && (
                          <>
                            <button onClick={() => handleApprove(req.id)} className="text-emerald-600 hover:text-emerald-800" title="Approve">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleReject(req.id)} className="text-red-600 hover:text-red-800" title="Reject">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {req.approvalStatus === 'APPROVED' && req.status !== 'CONVERTED' && (
                          <button 
                            onClick={() => handleConvertToPO(req.id)} 
                            className="text-purple-600 hover:text-purple-800" 
                            title="Convert to Purchase Order"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleEdit(req)} className="text-blue-600 hover:text-blue-800">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(req.id)} className="text-red-600 hover:text-red-800">
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
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold">{editing ? 'Edit' : 'New'} Requisition</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(90vh-80px)] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Title <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="input-modern" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Vendor</label>
                  <select value={formData.vendorId} onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })} className="input-modern">
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Required Date</label>
                  <input type="date" value={formData.requiredDate} onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })} className="input-modern" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="input-modern">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="2" className="input-modern"></textarea>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Items</h3>
                  <button type="button" onClick={addItem} className="btn-modern btn-secondary text-sm">
                    <Plus className="w-4 h-4 inline mr-1" /> Add Item
                  </button>
                </div>

                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                    <input type="text" placeholder="Item" value={item.itemName} onChange={(e) => handleItemChange(index, 'itemName', e.target.value)} className="col-span-4 input-modern" required />
                    <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))} className="col-span-2 input-modern" required />
                    <input type="text" placeholder="Unit" value={item.unit} onChange={(e) => handleItemChange(index, 'unit', e.target.value)} className="col-span-2 input-modern" />
                    <input type="number" step="0.01" placeholder="Price" value={item.estimatedPrice} onChange={(e) => handleItemChange(index, 'estimatedPrice', Number(e.target.value))} className="col-span-3 input-modern" />
                    <button type="button" onClick={() => removeItem(index)} className="col-span-1 text-red-600" disabled={formData.items.length === 1}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="text-right font-bold text-lg mt-2">Total: ${formData.totalAmount.toFixed(2)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="2" className="input-modern"></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-modern btn-secondary">Cancel</button>
                <button type="submit" className="btn-modern btn-primary">{editing ? 'Update' : 'Create'} Requisition</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PurchaseRequisitions;
