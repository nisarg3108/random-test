import React, { useEffect, useState } from 'react';
import { FileText, Plus, Search, Edit, Trash2, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import LineItemEditor from '../../components/sales/LineItemEditor';
import { useSalesStore } from '../../store/sales.store';
import { crmAPI } from '../../api/crm.api';

const statusStyles = {
  DRAFT: { label: 'Draft', color: 'text-gray-700', bg: 'bg-gray-100' },
  SENT: { label: 'Sent', color: 'text-blue-700', bg: 'bg-blue-100' },
  ACCEPTED: { label: 'Accepted', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  REJECTED: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100' },
  EXPIRED: { label: 'Expired', color: 'text-amber-700', bg: 'bg-amber-100' }
};

const QuotationsList = () => {
  const {
    quotations,
    loading,
    error,
    fetchQuotations,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    convertQuotationToOrder,
    clearError
  } = useSalesStore();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    customerId: '',
    dealId: '',
    customerName: '',
    customerEmail: '',
    items: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    status: 'DRAFT',
    validUntil: ''
  });

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  useEffect(() => {
    const loadCRMData = async () => {
      try {
        const [customersRes, dealsRes] = await Promise.all([
          crmAPI.getCustomers(),
          crmAPI.getDeals()
        ]);
        setCustomers(customersRes.data || []);
        setDeals(dealsRes.data || []);
      } catch (err) {
        console.error('Failed to load CRM data for quotations:', err);
      }
    };

    loadCRMData();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      customerId: '',
      dealId: '',
      customerName: '',
      customerEmail: '',
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      status: 'DRAFT',
      validUntil: ''
    });
    setEditing(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    const customer = customers.find((item) => item.id === customerId);
    setFormData({
      ...formData,
      customerId,
      customerName: customer?.name || ''
    });
  };

  const handleDealChange = (e) => {
    const dealId = e.target.value;
    const deal = deals.find((item) => item.id === dealId);
    setFormData({
      ...formData,
      dealId,
      customerId: deal?.customer?.id || formData.customerId,
      customerName: deal?.customer?.name || formData.customerName
    });
  };

  const handleTotalsChange = (totals) => {
    setFormData(prev => ({
      ...prev,
      items: totals.items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      validUntil: formData.validUntil || null
    };

    try {
      if (editing) {
        await updateQuotation(editing.id, payload);
      } else {
        await createQuotation(payload);
      }

      setShowModal(false);
      resetForm();
    } catch (submitError) {
      console.error('Failed to save quotation:', submitError);
    }
  };

  const handleEdit = (quotation) => {
    setEditing(quotation);
    setFormData({
      title: quotation.title || '',
      customerId: quotation.customerId || '',
      dealId: quotation.dealId || '',
      customerName: quotation.customerName || '',
      customerEmail: quotation.customerEmail || '',
      items: quotation.items || [],
      subtotal: quotation.subtotal || 0,
      tax: quotation.tax || 0,
      discount: quotation.discount || 0,
      total: quotation.total || 0,
      status: quotation.status || 'DRAFT',
      validUntil: quotation.validUntil ? quotation.validUntil.substring(0, 10) : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this quotation?')) {
      try {
        await deleteQuotation(id);
      } catch (deleteError) {
        console.error('Failed to delete quotation:', deleteError);
      }
    }
  };

  const handleConvertToOrder = async (id) => {
    if (window.confirm('Convert this quotation to a sales order?')) {
      try {
        await convertQuotationToOrder(id);
        alert('Successfully converted quotation to sales order!');
      } catch (convertError) {
        console.error('Failed to convert quotation:', convertError);
        alert('Error: ' + (convertError.message || 'Failed to convert quotation'));
      }
    }
  };

  const filtered = quotations.filter(q =>
    q.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: quotations.length,
    accepted: quotations.filter(q => q.status === 'ACCEPTED').length,
    pending: quotations.filter(q => ['DRAFT', 'SENT'].includes(q.status)).length,
    rejected: quotations.filter(q => q.status === 'REJECTED').length
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Quotations & Proposals</h1>
            <p className="text-primary-600 mt-1">Create, send, and track quotations</p>
          </div>
          <button
            onClick={() => { clearError(); setShowModal(true); }}
            className="btn-modern btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, icon: FileText, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Accepted', value: stats.accepted, icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Pending', value: stats.pending, icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600' },
            { label: 'Rejected', value: stats.rejected, icon: XCircle, bg: 'bg-red-50', color: 'text-red-600' }
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
              placeholder="Search by title or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
        </div>

        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">Quotations ({filtered.length})</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8"><LoadingSpinner /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No quotations found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Valid Until</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-primary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-200">
                  {filtered.map((q) => {
                    const status = statusStyles[q.status] || statusStyles.DRAFT;
                    return (
                      <tr key={q.id} className="hover:bg-primary-50">
                        <td className="px-6 py-4 text-sm font-medium text-primary-900">{q.title}</td>
                        <td className="px-6 py-4 text-sm text-primary-700">
                          <div className="font-medium">{q.customerName}</div>
                          <div className="text-xs text-primary-500">{q.customerEmail || '—'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-primary-900">₹{Number(q.total || 0).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-primary-700">
                          {q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {q.status === 'ACCEPTED' && (
                              <button
                                onClick={() => handleConvertToOrder(q.id)}
                                className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Convert to Order"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(q)}
                              className="p-2 text-primary-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(q.id)}
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
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="modern-card-elevated max-w-4xl w-full max-h-[90vh] overflow-y-auto">\n            <div className="px-6 py-4 border-b border-primary-200">
              <h3 className="text-lg font-semibold text-primary-900">
                {editing ? 'Edit Quotation' : 'New Quotation'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Title</label>
                <input
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="input-modern"
                  placeholder="Quotation title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Customer (CRM)</label>
                <select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleCustomerChange}
                  className="input-modern"
                >
                  <option value="">Link customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Deal (CRM)</label>
                <select
                  name="dealId"
                  value={formData.dealId}
                  onChange={handleDealChange}
                  className="input-modern"
                >
                  <option value="">Link deal</option>
                  {deals.map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      {deal.name} {deal.customer?.name ? `(${deal.customer.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Customer Name</label>
                <input
                  name="customerName"
                  type="text"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  className="input-modern"
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Customer Email</label>
                <input
                  name="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  className="input-modern"
                  placeholder="customer@email.com"
                />
              </div>
              <LineItemEditor
                items={formData.items}
                onTotalsChange={handleTotalsChange}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="input-modern"
                  >
                    {Object.keys(statusStyles).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Valid Until</label>
                  <input
                    name="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={handleChange}
                    className="input-modern"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); clearError(); }}
                  className="btn-modern btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-modern btn-primary disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editing ? 'Update Quotation' : 'Create Quotation')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default QuotationsList;
