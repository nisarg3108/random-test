import React, { useEffect, useState } from 'react';
import { DollarSign, Plus, Search, Edit, Trash2, CheckCircle, Clock, AlertTriangle, CreditCard } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import LineItemEditor from '../../components/sales/LineItemEditor';
import PaymentHistory from '../../components/sales/PaymentHistory';
import { useSalesStore } from '../../store/sales.store';
import { crmAPI } from '../../api/crm.api';

const statusStyles = {
  DRAFT: { label: 'Draft', color: 'text-gray-700', bg: 'bg-gray-100' },
  SENT: { label: 'Sent', color: 'text-blue-700', bg: 'bg-blue-100' },
  PAID: { label: 'Paid', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  PARTIALLY_PAID: { label: 'Partially Paid', color: 'text-amber-700', bg: 'bg-amber-100' },
  OVERDUE: { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-100' }
};

const InvoicesList = () => {
  const {
    invoices,
    loading,
    error,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    clearError
  } = useSalesStore();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    customerId: '',
    dealId: '',
    customerName: '',
    customerEmail: '',
    items: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    amountPaid: 0,
    status: 'DRAFT',
    issueDate: '',
    dueDate: ''
  });

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

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
        console.error('Failed to load CRM data for invoices:', err);
      }
    };

    loadCRMData();
  }, []);

  const resetForm = () => {
    setFormData({
      invoiceNumber: '',
      customerId: '',
      dealId: '',
      customerName: '',
      customerEmail: '',
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      amountPaid: 0,
      status: 'DRAFT',
      issueDate: '',
      dueDate: ''
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
      amountPaid: Number(formData.amountPaid || 0),
      issueDate: formData.issueDate || null,
      dueDate: formData.dueDate || null
    };

    try {
      if (editing) {
        await updateInvoice(editing.id, payload);
      } else {
        await createInvoice(payload);
      }

      setShowModal(false);
      resetForm();
    } catch (submitError) {
      console.error('Failed to save invoice:', submitError);
    }
  };

  const handleEdit = (invoice) => {
    setEditing(invoice);
    setFormData({
      invoiceNumber: invoice.invoiceNumber || '',
      customerId: invoice.customerId || '',
      dealId: invoice.dealId || '',
      customerName: invoice.customerName || '',
      customerEmail: invoice.customerEmail || '',
      items: invoice.items || [],
      subtotal: invoice.subtotal || 0,
      tax: invoice.tax || 0,
      discount: invoice.discount || 0,
      total: invoice.total || 0,
      amountPaid: invoice.amountPaid || 0,
      status: invoice.status || 'DRAFT',
      issueDate: invoice.issueDate ? invoice.issueDate.substring(0, 10) : '',
      dueDate: invoice.dueDate ? invoice.dueDate.substring(0, 10) : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this invoice?')) {
      try {
        await deleteInvoice(id);
      } catch (deleteError) {
        console.error('Failed to delete invoice:', deleteError);
      }
    }
  };

  const handleShowPayments = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const handleClosePayments = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
  };

  const handlePaymentChange = () => {
    fetchInvoices();
  };

  const filtered = invoices.filter(i =>
    i.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'PAID').length,
    overdue: invoices.filter(i => i.status === 'OVERDUE').length,
    pending: invoices.filter(i => ['DRAFT', 'SENT', 'PARTIALLY_PAID'].includes(i.status)).length
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Invoicing</h1>
            <p className="text-primary-600 mt-1">Issue, track, and collect payments</p>
          </div>
          <button
            onClick={() => { clearError(); setShowModal(true); }}
            className="btn-modern btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Invoices', value: stats.total, icon: DollarSign, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Paid', value: stats.paid, icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Pending', value: stats.pending, icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600' },
            { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, bg: 'bg-red-50', color: 'text-red-600' }
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
              placeholder="Search by invoice number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
        </div>

        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">Invoices ({filtered.length})</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8"><LoadingSpinner /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No invoices found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-primary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-200">
                  {filtered.map((i) => {
                    const status = statusStyles[i.status] || statusStyles.DRAFT;
                    return (
                      <tr key={i.id} className="hover:bg-primary-50">
                        <td className="px-6 py-4 text-sm font-medium text-primary-900">
                          {i.invoiceNumber || i.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-sm text-primary-700">
                          <div className="font-medium">{i.customerName}</div>
                          <div className="text-xs text-primary-500">{i.customerEmail || '—'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-primary-900">₹{Number(i.total || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-primary-700">₹{Number(i.amountPaid || 0).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleShowPayments(i)}
                              className="p-2 text-primary-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="View Payments"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(i)}
                              className="p-2 text-primary-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(i.id)}
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
          <div className="modern-card-elevated max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-primary-200">
              <h3 className="text-lg font-semibold text-primary-900">
                {editing ? 'Edit Invoice' : 'New Invoice'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Invoice Number</label>
                <input
                  name="invoiceNumber"
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  className="input-modern"
                  placeholder="Optional"
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
                  <label className="block text-sm font-medium text-primary-700 mb-1">Issue Date</label>
                  <input
                    name="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={handleChange}
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Due Date</label>
                  <input
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="input-modern"
                  />
                </div>
              </div>

              {editing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Payment status and amount paid are managed through the payment history. 
                    Use the <strong>Payments</strong> button (💳) in the invoice list to record and track payments.
                  </p>
                </div>
              )}

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
                  {loading ? 'Saving...' : (editing ? 'Update Invoice' : 'Create Invoice')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="modern-card-elevated max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-primary-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-primary-900">
                  Payment History
                </h3>
                <p className="text-sm text-primary-600">
                  Invoice: {selectedInvoice.invoiceNumber || selectedInvoice.id.slice(0, 8).toUpperCase()} - {selectedInvoice.customerName}
                </p>
              </div>
              <button
                onClick={handleClosePayments}
                className="text-primary-600 hover:text-primary-900"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <PaymentHistory
                invoice={selectedInvoice}
                onPaymentChange={handlePaymentChange}
              />
            </div>
            <div className="px-6 py-4 border-t border-primary-200 flex justify-end">
              <button
                onClick={handleClosePayments}
                className="btn-modern btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default InvoicesList;
