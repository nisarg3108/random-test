import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Users, Building2, Globe, Edit, Trash2 } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { crmAPI } from '../../api/crm.api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    website: '',
    status: 'ACTIVE',
    notes: ''
  });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await crmAPI.getCustomers();
      setCustomers(response.data || []);
    } catch (err) {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [customers, searchTerm]);

  const resetForm = () => {
    setFormData({ name: '', industry: '', website: '', status: 'ACTIVE', notes: '' });
    setEditingCustomer(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editingCustomer) {
        await crmAPI.updateCustomer(editingCustomer.id, formData);
      } else {
        await crmAPI.createCustomer(formData);
      }
      setShowModal(false);
      resetForm();
      loadCustomers();
    } catch (err) {
      setError('Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      industry: customer.industry || '',
      website: customer.website || '',
      status: customer.status || 'ACTIVE',
      notes: customer.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await crmAPI.deleteCustomer(id);
      loadCustomers();
    } catch (err) {
      setError('Failed to delete customer');
    }
  };

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'ACTIVE').length,
    withDeals: customers.filter(c => (c.deals || []).length > 0).length
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Customer Management</h1>
            <p className="text-primary-600 mt-1">Manage customers, accounts, and client profiles</p>
          </div>
          <button className="btn-modern btn-primary flex items-center space-x-2" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Customers', value: stats.total, icon: Users, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Active Customers', value: stats.active, icon: Building2, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'With Deals', value: stats.withDeals, icon: Globe, bg: 'bg-purple-50', color: 'text-purple-600' }
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

        <div className="modern-card-elevated p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
        </div>

        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">Customers ({filteredCustomers.length})</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8"><LoadingSpinner /></div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No customers found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Industry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Website</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-primary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-primary-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-primary-900">{customer.name}</div>
                            <div className="text-xs text-primary-500">{customer.notes || 'No notes'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-primary-700">{customer.industry || '—'}</td>
                      <td className="px-6 py-4 text-sm text-primary-700">{customer.website || '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${customer.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => handleEdit(customer)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(customer.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="px-6 py-4 border-b border-primary-200">
                <h3 className="text-lg font-semibold text-primary-900">
                  {editingCustomer ? 'Edit Customer' : 'Add Customer'}
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700">Customer Name</label>
                  <input
                    className="input-modern mt-1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Industry</label>
                    <input
                      className="input-modern mt-1"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Website</label>
                    <input
                      className="input-modern mt-1"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700">Status</label>
                  <select
                    className="input-modern mt-1"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700">Notes</label>
                  <textarea
                    className="input-modern mt-1"
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" className="btn-modern btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-modern btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Customer'}
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

export default Customers;
