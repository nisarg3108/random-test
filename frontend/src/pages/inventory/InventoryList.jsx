import React, { useEffect, useState } from 'react';
import { 
  Package, Plus, Search, Filter, Edit, Trash2, 
  DollarSign, TrendingUp, AlertTriangle, CheckCircle
} from 'lucide-react';
import { apiClient } from '../../api/http';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const InventoryList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
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

  useEffect(() => {
    loadItems();
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

      if (editingItem) {
        await apiClient.put(`/inventory/${editingItem.id}`, itemData);
      } else {
        await apiClient.post('/inventory', itemData);
      }
      
      setShowModal(false);
      resetForm();
      loadItems();
    } catch (err) {
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
        await apiClient.delete(`/inventory/${id}`);
        loadItems();
      } catch (err) {
        setError('Failed to delete item');
      }
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
      return { label: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle };
    } else if (quantity < 10) {
      return { label: 'Low Stock', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: AlertTriangle };
    } else {
      return { label: 'In Stock', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle };
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
            <h1 className="text-3xl font-bold text-slate-900">Inventory Management</h1>
            <p className="text-slate-600 mt-1">Manage your inventory items and stock levels</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[
            { label: 'Total Items', value: stats.total, icon: Package, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
            { label: 'In Stock', value: stats.inStock, icon: CheckCircle, color: 'bg-green-500', bgColor: 'bg-green-50' },
            { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: 'bg-yellow-500', bgColor: 'bg-yellow-50' },
            { label: 'Out of Stock', value: stats.outOfStock, icon: AlertTriangle, color: 'bg-red-500', bgColor: 'bg-red-50' },
            { label: 'Total Value', value: `₹${stats.totalValue.toFixed(2)}`, icon: DollarSign, color: 'bg-purple-500', bgColor: 'bg-purple-50' }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 text-slate-600`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search items by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Items ({filteredItems.length})</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8">
                <LoadingSpinner />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No inventory items found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredItems.map((item) => {
                    const status = getStockStatus(item.quantity);
                    const StatusIcon = status.icon;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900">{item.name}</div>
                              <div className="text-sm text-slate-500">{item.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600">{item.sku}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">₹{item.price?.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.quantity}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => handleEdit(item)}
                              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      </div>

      {/* Add/Edit Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Item Name</label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter item name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">SKU</label>
                <input
                  name="sku"
                  type="text"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter SKU"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Price</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
                  <input
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <input
                  name="category"
                  type="text"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter category"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter description"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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