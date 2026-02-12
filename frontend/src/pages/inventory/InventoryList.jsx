import React, { useEffect, useState } from 'react';
import { 
  Package, Plus, Search, Edit, Trash2, 
  DollarSign, AlertTriangle, CheckCircle
} from 'lucide-react';
import { apiClient } from '../../api/http';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const InventoryList = () => {
  const [items, setItems] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('items');
  const [workflowSetup, setWorkflowSetup] = useState({ checked: false, exists: false, seeding: false });
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    quantity: '',
    description: '',
    category: ''
  });

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/inventory');
      setItems(response.data || []);
    } catch (err) {
      setError('Failed to load inventory items');
      console.error('Load inventory error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadApprovals = async () => {
    try {
      const [approvalsRes, requestsRes] = await Promise.all([
        apiClient.get('/approvals'),
        apiClient.get('/approvals/my-requests')
      ]);
      
      // Filter for inventory-related approvals
      const inventoryApprovals = (approvalsRes.data || []).filter(
        a => a.workflowRequest?.module === 'INVENTORY' && a.status === 'PENDING'
      );
      const inventoryRequests = (requestsRes.data || []).filter(
        r => r.module === 'INVENTORY'
      );
      
      setPendingApprovals(inventoryApprovals);
      setMyRequests(inventoryRequests);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    }
  };

  const checkWorkflowSetup = async () => {
    try {
      const response = await apiClient.get('/inventory/debug/workflow');
      const hasWorkflows = response.data?.workflows?.CREATE !== null;
      setWorkflowSetup({ checked: true, exists: hasWorkflows, seeding: false });
      
      if (!hasWorkflows) {
        console.log('⚠️ No workflows configured for inventory');
      }
    } catch (err) {
      console.error('Failed to check workflow setup:', err);
      setWorkflowSetup({ checked: true, exists: false, seeding: false });
    }
  };

  const seedWorkflows = async () => {
    setWorkflowSetup(prev => ({ ...prev, seeding: true }));
    try {
      const response = await apiClient.post('/approvals/seed-workflows');
      setSuccess('Approval workflows have been configured successfully!');
      setWorkflowSetup({ checked: true, exists: true, seeding: false });
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to configure workflows');
      setWorkflowSetup(prev => ({ ...prev, seeding: false }));
    }
  };

  useEffect(() => {
    loadItems();
    loadApprovals();
    checkWorkflowSetup();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const itemData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity)
      };

      let result;
      if (editingItem) {
        result = await apiClient.put(`/inventory/${editingItem.id}`, itemData);
      } else {
        result = await apiClient.post('/inventory', itemData);
      }
      
      // Check if the operation was successful
      if (result.data) {
        if (result.data.message && result.data.message.includes('Approval required')) {
          // Item is pending approval
          setSuccess(`Item ${editingItem ? 'update' : 'creation'} submitted for approval. You can track it in the "My Requests" tab.`);
          loadApprovals();
        } else {
          setSuccess(`Item ${editingItem ? 'updated' : 'created'} successfully!`);
        }
        // Close modal and reset form for both success and approval cases
        setShowModal(false);
        resetForm();
        // Reload items to get the latest state
        loadItems();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      sku: item.sku || '',
      price: item.price?.toString() || '',
      quantity: item.quantity?.toString() || '',
      description: item.description || '',
      category: item.category || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const result = await apiClient.delete(`/inventory/${id}`);
        if (result.data?.message && result.data.message.includes('approval required')) {
          setSuccess('Delete request submitted for approval.');
          loadApprovals();
        } else {
          setSuccess('Item deleted successfully!');
          loadItems();
        }
        setTimeout(() => setSuccess(''), 4000);
      } catch (err) {
        setError('Failed to delete item');
      }
    }
  };

  const handleApprove = async (approvalId) => {
    try {
      await apiClient.post(`/approvals/${approvalId}/approve`);
      setSuccess('Request approved successfully!');
      loadApprovals();
      loadItems();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (approvalId) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      await apiClient.post(`/approvals/${approvalId}/reject`, { reason });
      setSuccess('Request rejected successfully!');
      loadApprovals();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to reject request');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', sku: '', price: '', quantity: '', description: '', category: '' });
    setEditingItem(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredItems = items.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (quantity) => {
    if (quantity === 0) {
      return { label: 'Out of Stock', color: 'text-red-700', bg: 'bg-red-100' };
    } else if (quantity < 10) {
      return { label: 'Low Stock', color: 'text-amber-700', bg: 'bg-amber-100' };
    } else {
      return { label: 'In Stock', color: 'text-emerald-700', bg: 'bg-emerald-100' };
    }
  };

  const stats = {
    total: items.length,
    inStock: items.filter(item => item.quantity > 0).length,
    lowStock: items.filter(item => item.quantity > 0 && item.quantity < 10).length,
    outOfStock: items.filter(item => item.quantity === 0).length,
    totalValue: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Inventory Management</h1>
            <p className="text-primary-600 mt-1">Manage your inventory items and stock levels</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-modern btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Workflow Setup Alert */}
        {workflowSetup.checked && !workflowSetup.exists && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold">Approval Workflow Not Configured</p>
                  <p className="text-sm mt-1">Inventory items are being created directly without approval. Click the button to enable approval workflows.</p>
                </div>
              </div>
              <button
                onClick={seedWorkflows}
                disabled={workflowSetup.seeding}
                className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium whitespace-nowrap disabled:opacity-50"
              >
                {workflowSetup.seeding ? 'Setting up...' : 'Enable Approvals'}
              </button>
            </div>
          </div>
        )}

        {/* Workflow Setup Alert */}
        {workflowSetup.checked && !workflowSetup.exists && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold">Approval Workflow Not Configured</p>
                  <p className="text-sm mt-1">Inventory items are being created directly without approval. Click the button to enable approval workflows.</p>
                </div>
              </div>
              <button
                onClick={seedWorkflows}
                disabled={workflowSetup.seeding}
                className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium whitespace-nowrap disabled:opacity-50"
              >
                {workflowSetup.seeding ? 'Setting up...' : 'Enable Approvals'}
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Items', value: stats.total, icon: Package, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'In Stock', value: stats.inStock, icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, bg: 'bg-amber-50', color: 'text-amber-600' },
            { label: 'Out of Stock', value: stats.outOfStock, icon: AlertTriangle, bg: 'bg-red-50', color: 'text-red-600' },
            { label: 'Total Value', value: `₹${stats.totalValue.toFixed(2)}`, icon: DollarSign, bg: 'bg-purple-50', color: 'text-purple-600' }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="modern-card-elevated p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-600">{stat.label}</p>
                    <p className="text-xl font-bold text-primary-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div className="modern-card-elevated p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="modern-card-elevated">
          <div className="border-b border-primary-200">
            <nav className="flex gap-4 px-6">
              <button
                onClick={() => setActiveTab('items')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'items'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Inventory Items ({items.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Pending Approvals ({pendingApprovals.length})
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'requests'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Requests ({myRequests.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Inventory Table */}
        {activeTab === 'items' && (
        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">Items ({filteredItems.length})</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8">
                <LoadingSpinner />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No inventory items found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Value</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-primary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-200">
                  {filteredItems.map((item) => {
                    const status = getStockStatus(item.quantity);
                    return (
                      <tr key={item.id} className="hover:bg-primary-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Package className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-primary-900">{item.name}</div>
                              <div className="text-sm text-primary-500">{item.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-primary-600">{item.sku}</td>
                        <td className="px-6 py-4 text-sm font-medium text-primary-900">₹{item.price?.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-primary-900">{item.quantity}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-primary-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => handleEdit(item)}
                              className="p-2 text-primary-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-primary-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
        )}

        {/* Pending Approvals Tab */}
        {activeTab === 'pending' && (
        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">Pending Approvals ({pendingApprovals.length})</h2>
          </div>
          <div className="p-6">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((approval) => (
                  <div key={approval.id} className="border border-primary-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-primary-900">
                          {approval.workflowRequest?.action} - {approval.workflowRequest?.payload?.name || 'Inventory Item'}
                        </h3>
                        <p className="text-sm text-primary-600 mt-1">
                          Step {approval.stepOrder}: {approval.workflowStep?.name}
                        </p>
                        <div className="mt-2 text-sm text-gray-600">
                          <p><strong>SKU:</strong> {approval.workflowRequest?.payload?.sku || 'N/A'}</p>
                          <p><strong>Price:</strong> ₹{approval.workflowRequest?.payload?.price || 0}</p>
                          <p><strong>Quantity:</strong> {approval.workflowRequest?.payload?.quantity || 0}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(approval.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(approval.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* My Requests Tab */}
        {activeTab === 'requests' && (
        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">My Requests ({myRequests.length})</h2>
          </div>
          <div className="p-6">
            {myRequests.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No requests submitted</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <div key={request.id} className="border border-primary-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-primary-900">
                          {request.action} - {request.payload?.name || 'Inventory Item'}
                        </h3>
                        <div className="mt-2 text-sm text-gray-600">
                          <p><strong>SKU:</strong> {request.payload?.sku || 'N/A'}</p>
                          <p><strong>Status:</strong> <span className={`font-semibold ${
                            request.status === 'APPROVED' ? 'text-green-600' :
                            request.status === 'REJECTED' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>{request.status}</span></p>
                          <p><strong>Submitted:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Add/Edit Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="modern-card-elevated max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-primary-200">
              <h3 className="text-lg font-semibold text-primary-900">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Item Name</label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-modern"
                  placeholder="Enter item name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">SKU</label>
                <input
                  name="sku"
                  type="text"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                  className="input-modern"
                  placeholder="Enter SKU"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Price</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="input-modern"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Quantity</label>
                  <input
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    className="input-modern"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Category</label>
                <input
                  name="category"
                  type="text"
                  value={formData.category}
                  onChange={handleChange}
                  className="input-modern"
                  placeholder="Enter category"
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
                  placeholder="Enter description"
                />
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
                  {loading ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default InventoryList;