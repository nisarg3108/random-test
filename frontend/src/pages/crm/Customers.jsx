import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users, Building2, Globe, Edit, Trash2, DollarSign, Briefcase, MapPin, Phone, Mail, User } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { crmAPI } from '../../api/crm.api';

const CUSTOMER_TYPES = ['BUSINESS', 'INDIVIDUAL'];
const COMPANY_SIZES = ['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'];
const CUSTOMER_CATEGORIES = ['CUSTOMER', 'PARTNER', 'PROSPECT'];
const CUSTOMER_SOURCES = ['WEB', 'REFERRAL', 'EVENT', 'CAMPAIGN', 'COLD_CALL', 'TRADE_SHOW'];
const PREFERRED_CHANNELS = ['EMAIL', 'PHONE', 'SMS', 'IN_PERSON'];
const CUSTOMER_STATUSES = ['ACTIVE', 'INACTIVE', 'CHURNED', 'PROSPECTIVE'];

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'BUSINESS',
    industry: '',
    website: '',
    status: 'ACTIVE',
    companySize: '',
    annualRevenue: '',
    currencyCode: 'USD',
    primaryEmail: '',
    primaryPhone: '',
    billingAddress: { street: '', city: '', state: '', zip: '', country: '' },
    shippingAddress: { street: '', city: '', state: '', zip: '', country: '' },
    sameAsbilling: false,
    category: 'CUSTOMER',
    source: '',
    preferredChannel: 'EMAIL',
    timezone: '',
    notes: ''
  });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params = {
        ...(filterType && { type: filterType }),
        ...(filterCategory && { category: filterCategory }),
        ...(filterStatus && { status: filterStatus })
      };
      const response = await crmAPI.getCustomers(params);
      setCustomers(response.data || []);
    } catch (err) {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [filterType, filterCategory, filterStatus]);

  const filteredCustomers = useMemo(() => customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [customers, searchTerm]);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'BUSINESS',
      industry: '',
      website: '',
      status: 'ACTIVE',
      companySize: '',
      annualRevenue: '',
      currencyCode: 'USD',
      primaryEmail: '',
      primaryPhone: '',
      billingAddress: { street: '', city: '', state: '', zip: '', country: '' },
      shippingAddress: { street: '', city: '', state: '', zip: '', country: '' },
      sameAsBilling: false,
      category: 'CUSTOMER',
      source: '',
      preferredChannel: 'EMAIL',
      timezone: '',
      notes: ''
    });
    setEditingCustomer(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...formData,
        annualRevenue: formData.annualRevenue ? Number(formData.annualRevenue) : null,
        billingAddress: formData.billingAddress.street ? formData.billingAddress : null,
        shippingAddress: formData.sameAsBilling 
          ? formData.billingAddress 
          : (formData.shippingAddress.street ? formData.shippingAddress : null)
      };
      
      if (editingCustomer) {
        await crmAPI.updateCustomer(editingCustomer.id, payload);
      } else {
        await crmAPI.createCustomer(payload);
      }
      setShowModal(false);
      resetForm();
      loadCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    const billing = customer.billingAddress || { street: '', city: '', state: '', zip: '', country: '' };
    const shipping = customer.shippingAddress || { street: '', city: '', state: '', zip: '', country: '' };
    setFormData({
      name: customer.name || '',
      type: customer.type || 'BUSINESS',
      industry: customer.industry || '',
      website: customer.website || '',
      status: customer.status || 'ACTIVE',
      companySize: customer.companySize || '',
      annualRevenue: customer.annualRevenue || '',
      currencyCode: customer.currencyCode || 'USD',
      primaryEmail: customer.primaryEmail || '',
      primaryPhone: customer.primaryPhone || '',
      billingAddress: billing,
      shippingAddress: shipping,
      sameAsBilling: JSON.stringify(billing) === JSON.stringify(shipping),
      category: customer.category || 'CUSTOMER',
      source: customer.source || '',
      preferredChannel: customer.preferredChannel || 'EMAIL',
      timezone: customer.timezone || '',
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

  const stats = useMemo(() => {
    const activeCustomers = customers.filter(c => c.status === 'ACTIVE').length;
    const businessAccounts = customers.filter(c => c.type === 'BUSINESS').length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.annualRevenue || 0), 0);
    const partnersCount = customers.filter(c => c.category === 'PARTNER').length;
    return {
      total: customers.length,
      active: activeCustomers,
      business: businessAccounts,
      revenue: totalRevenue,
      partners: partnersCount,
      withDeals: customers.filter(c => (c.deals || []).length > 0).length
    };
  }, [customers]);

  const formatRevenue = (revenue) => {
    if (!revenue) return '—';
    if (revenue >= 1000000) return `$${(revenue / 1000000).toFixed(1)}M`;
    if (revenue >= 1000) return `$${(revenue / 1000).toFixed(0)}K`;
    return `$${revenue.toFixed(0)}`;
  };

  const getTypeBadge = (type) => {
    return type === 'BUSINESS' 
      ? <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><Building2 className="w-3 h-3" /><span>{type}</span></span>
      : <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700"><User className="w-3 h-3" /><span>{type}</span></span>;
  };

  const getCategoryBadge = (category) => {
    const config = {
      CUSTOMER: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      PARTNER: { bg: 'bg-blue-100', text: 'text-blue-700' },
      PROSPECT: { bg: 'bg-orange-100', text: 'text-orange-700' }
    };
    const { bg, text } = config[category] || config.CUSTOMER;
    return <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>{category}</span>;
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Customers', value: stats.total, icon: Users, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Active', value: stats.active, icon: Building2, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Total Revenue', value: formatRevenue(stats.revenue), icon: DollarSign, bg: 'bg-purple-50', color: 'text-purple-600' },
            { label: 'Partners', value: stats.partners, icon: Briefcase, bg: 'bg-orange-50', color: 'text-orange-600' }
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

        {/* Filters */}
        <div className="modern-card-elevated p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-modern"
            >
              <option value="">All Types</option>
              {CUSTOMER_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-modern"
            >
              <option value="">All Categories</option>
              {CUSTOMER_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-modern"
            >
              <option value="">All Status</option>
              {CUSTOMER_STATUSES.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Industry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Contact</th>
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
                            {customer.type === 'BUSINESS' ? <Building2 className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-purple-600" />}
                          </div>
                          <div className="ml-3">
                            <Link to={`/crm/customers/${customer.id}`} className="text-sm font-medium text-primary-900 hover:underline">
                              {customer.name}
                            </Link>
                            {customer.companySize && (
                              <div className="text-xs text-primary-500">{customer.companySize}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{getTypeBadge(customer.type || 'BUSINESS')}</td>
                      <td className="px-6 py-4 text-sm">{getCategoryBadge(customer.category || 'CUSTOMER')}</td>
                      <td className="px-6 py-4 text-sm text-primary-700">{customer.industry || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-primary-900">{formatRevenue(customer.annualRevenue)}</div>
                        {customer.currencyCode && customer.annualRevenue && (
                          <div className="text-xs text-primary-500">{customer.currencyCode}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          {customer.primaryEmail && (
                            <div className="flex items-center space-x-1 text-xs text-primary-700">
                              <Mail className="w-3 h-3 text-primary-400" />
                              <span>{customer.primaryEmail}</span>
                            </div>
                          )}
                          {customer.primaryPhone && (
                            <div className="flex items-center space-x-1 text-xs text-primary-700">
                              <Phone className="w-3 h-3 text-primary-400" />
                              <span>{customer.primaryPhone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          customer.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                          customer.status === 'INACTIVE' ? 'bg-gray-100 text-gray-700' :
                          customer.status === 'CHURNED' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
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

        {/* Create/Edit Customer Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-primary-900">
                  {editingCustomer ? 'Edit Customer' : 'New Customer'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-sm font-semibold text-primary-800 mb-3 uppercase tracking-wide">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input-modern"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="input-modern"
                      >
                        {CUSTOMER_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="input-modern"
                      >
                        {CUSTOMER_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="input-modern"
                      >
                        {CUSTOMER_STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                      <input
                        type="text"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="input-modern"
                        placeholder="Technology, Healthcare, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="input-modern"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                      <select
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        className="input-modern"
                      >
                        <option value="">Select Source</option>
                        {CUSTOMER_SOURCES.map(source => (
                          <option key={source} value={source}>{source}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Company Information */}
                {formData.type === 'BUSINESS' && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-semibold text-primary-800 mb-3 uppercase tracking-wide">Company Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                        <select
                          value={formData.companySize}
                          onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                          className="input-modern"
                        >
                          <option value="">Select Size</option>
                          {COMPANY_SIZES.map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Annual Revenue</label>
                        <input
                          type="number"
                          value={formData.annualRevenue}
                          onChange={(e) => setFormData({ ...formData, annualRevenue: e.target.value })}
                          className="input-modern"
                          min="0"
                          step="1000"
                          placeholder="1000000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                        <select
                          value={formData.currencyCode}
                          onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                          className="input-modern"
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="INR">INR</option>
                          <option value="JPY">JPY</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Details */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-primary-800 mb-3 uppercase tracking-wide">Contact Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Primary Email</label>
                      <input
                        type="email"
                        value={formData.primaryEmail}
                        onChange={(e) => setFormData({ ...formData, primaryEmail: e.target.value })}
                        className="input-modern"
                        placeholder="contact@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone</label>
                      <input
                        type="tel"
                        value={formData.primaryPhone}
                        onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                        className="input-modern"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Channel</label>
                      <select
                        value={formData.preferredChannel}
                        onChange={(e) => setFormData({ ...formData, preferredChannel: e.target.value })}
                        className="input-modern"
                      >
                        {PREFERRED_CHANNELS.map(channel => (
                          <option key={channel} value={channel}>{channel}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                      <input
                        type="text"
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        className="input-modern"
                        placeholder="America/New_York"
                      />
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-primary-800 mb-3 uppercase tracking-wide">Billing Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                      <input
                        type="text"
                        value={formData.billingAddress.street}
                        onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress, street: e.target.value } })}
                        className="input-modern"
                        placeholder="123 Main St"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={formData.billingAddress.city}
                        onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress, city: e.target.value } })}
                        className="input-modern"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                      <input
                        type="text"
                        value={formData.billingAddress.state}
                        onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress, state: e.target.value } })}
                        className="input-modern"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
                      <input
                        type="text"
                        value={formData.billingAddress.zip}
                        onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress, zip: e.target.value } })}
                        className="input-modern"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={formData.billingAddress.country}
                        onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress, country: e.target.value } })}
                        className="input-modern"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-primary-800 uppercase tracking-wide">Shipping Address</h3>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sameAsBilling}
                        onChange={(e) => setFormData({ ...formData, sameAsBilling: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Same as billing</span>
                    </label>
                  </div>
                  {!formData.sameAsBilling && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                        <input
                          type="text"
                          value={formData.shippingAddress.street}
                          onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, street: e.target.value } })}
                          className="input-modern"
                          placeholder="123 Main St"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          value={formData.shippingAddress.city}
                          onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, city: e.target.value } })}
                          className="input-modern"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                        <input
                          type="text"
                          value={formData.shippingAddress.state}
                          onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, state: e.target.value } })}
                          className="input-modern"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
                        <input
                          type="text"
                          value={formData.shippingAddress.zip}
                          onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, zip: e.target.value } })}
                          className="input-modern"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <input
                          type="text"
                          value={formData.shippingAddress.country}
                          onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, country: e.target.value } })}
                          className="input-modern"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Information */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-primary-800 mb-3 uppercase tracking-wide">Additional Notes</h3>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-modern"
                    rows={4}
                    placeholder="Additional notes about this customer..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="btn-modern btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="btn-modern btn-primary">
                    {loading ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
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
