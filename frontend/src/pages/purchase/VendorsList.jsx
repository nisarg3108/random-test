import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, Edit, Trash2, Star, TrendingUp, MapPin, Mail, Phone } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const statusStyles = {
  ACTIVE: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  INACTIVE: { label: 'Inactive', color: 'text-gray-700', bg: 'bg-gray-100' },
  BLOCKED: { label: 'Blocked', color: 'text-red-700', bg: 'bg-red-100' }
};

const VendorsList = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    website: '',
    taxId: '',
    paymentTerms: 'NET30',
    creditLimit: '',
    currency: 'USD',
    status: 'ACTIVE',
    category: '',
    bankName: '',
    accountNumber: '',
    swiftCode: '',
    notes: ''
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/purchase/vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(response.data);
    } catch (err) {
      setError('Failed to fetch vendors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      website: '',
      taxId: '',
      paymentTerms: 'NET30',
      creditLimit: '',
      currency: 'USD',
      status: 'ACTIVE',
      category: '',
      bankName: '',
      accountNumber: '',
      swiftCode: '',
      notes: ''
    });
    setEditing(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const payload = {
      ...formData,
      creditLimit: formData.creditLimit ? Number(formData.creditLimit) : null
    };

    try {
      if (editing) {
        await axios.put(`${API_URL}/api/purchase/vendors/${editing.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/purchase/vendors`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setShowModal(false);
      resetForm();
      fetchVendors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vendor');
    }
  };

  const handleEdit = (vendor) => {
    setEditing(vendor);
    setFormData({
      name: vendor.name || '',
      contactPerson: vendor.contactPerson || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      country: vendor.country || '',
      postalCode: vendor.postalCode || '',
      website: vendor.website || '',
      taxId: vendor.taxId || '',
      paymentTerms: vendor.paymentTerms || 'NET30',
      creditLimit: vendor.creditLimit?.toString() || '',
      currency: vendor.currency || 'USD',
      status: vendor.status || 'ACTIVE',
      category: vendor.category || '',
      bankName: vendor.bankName || '',
      accountNumber: vendor.accountNumber || '',
      swiftCode: vendor.swiftCode || '',
      notes: vendor.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vendor? This action cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/purchase/vendors/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchVendors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete vendor');
    }
  };

  const filtered = vendors.filter(v =>
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vendorCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: vendors.length,
    active: vendors.filter(v => v.status === 'ACTIVE').length,
    avgRating: vendors.length > 0 
      ? (vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.length).toFixed(1)
      : '0'
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Vendors</h1>
            <p className="text-primary-600 mt-1">Manage supplier and vendor information</p>
          </div>
          <button
            onClick={() => { setError(''); resetForm(); setShowModal(true); }}
            className="btn-modern btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vendor</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Total Vendors</p>
                <p className="text-xl font-bold text-primary-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Active Vendors</p>
                <p className="text-xl font-bold text-primary-900 mt-1">{stats.active}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Avg Rating</p>
                <p className="text-xl font-bold text-primary-900 mt-1 flex items-center">
                  {stats.avgRating}
                  <Star className="w-4 h-4 text-amber-500 ml-1 fill-current" />
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-50">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="modern-card-elevated p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors by name, code, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
        </div>

        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">Vendors List ({filtered.length})</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8"><LoadingSpinner /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No vendors found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-primary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-200">
                  {filtered.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-primary-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-primary-900">{vendor.vendorCode}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-primary-900">{vendor.name}</div>
                          <div className="text-sm text-primary-600">{vendor.category || 'Uncategorized'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="space-y-1">
                          {vendor.email && (
                            <div className="flex items-center text-primary-600">
                              <Mail className="w-3 h-3 mr-1" />
                              <span>{vendor.email}</span>
                            </div>
                          )}
                          {vendor.phone && (
                            <div className="flex items-center text-primary-600">
                              <Phone className="w-3 h-3 mr-1" />
                              <span>{vendor.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-primary-600">
                        <div className="flex items-start">
                          <MapPin className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{[vendor.city, vendor.country].filter(Boolean).join(', ') || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-amber-500 fill-current mr-1" />
                          <span className="font-medium">{vendor.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[vendor.status]?.bg} ${statusStyles[vendor.status]?.color}`}>
                          {statusStyles[vendor.status]?.label || vendor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(vendor)}
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor.id)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-primary-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-primary-900">
                {editing ? 'Edit Vendor' : 'Add New Vendor'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-primary-400 hover:text-primary-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input-modern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Contact Person</label>
                  <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="input-modern" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-modern" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Phone</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input-modern" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Website</label>
                  <input type="text" name="website" value={formData.website} onChange={handleChange} className="input-modern" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-primary-700 mb-1">Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className="input-modern" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className="input-modern" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">State</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} className="input-modern" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Country</label>
                  <input type="text" name="country" value={formData.country} onChange={handleChange} className="input-modern" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Postal Code</label>
                  <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} className="input-modern" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Tax ID</label>
                  <input type="text" name="taxId" value={formData.taxId} onChange={handleChange} className="input-modern" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="input-modern">
                    <option value="">Select Category</option>
                    <option value="RAW_MATERIALS">Raw Materials</option>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="SERVICES">Services</option>
                    <option value="PACKAGING">Packaging</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Payment Terms</label>
                  <select name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} className="input-modern">
                    <option value="COD">Cash on Delivery</option>
                    <option value="NET15">Net 15</option>
                    <option value="NET30">Net 30</option>
                    <option value="NET60">Net 60</option>
                    <option value="NET90">Net 90</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Credit Limit</label>
                  <input type="number" step="0.01" name="creditLimit" value={formData.creditLimit} onChange={handleChange} className="input-modern" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Currency</label>
                  <select name="currency" value={formData.currency} onChange={handleChange} className="input-modern">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="input-modern">
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Bank Name</label>
                  <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="input-modern" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Account Number</label>
                  <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="input-modern" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">SWIFT Code</label>
                  <input type="text" name="swiftCode" value={formData.swiftCode} onChange={handleChange} className="input-modern" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-primary-700 mb-1">Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="input-modern"></textarea>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn-modern btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modern btn-primary">
                  {editing ? 'Update' : 'Create'} Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default VendorsList;
