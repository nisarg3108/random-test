import React, { useEffect, useState } from 'react';
import { Truck, Plus, Search, Edit, Trash2 } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useSalesStore } from '../../store/sales.store';

const statusStyles = {
  PENDING: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100' },
  PROCESSING: { label: 'Processing', color: 'text-blue-700', bg: 'bg-blue-100' },
  SHIPPED: { label: 'Shipped', color: 'text-purple-700', bg: 'bg-purple-100' },
  IN_TRANSIT: { label: 'In Transit', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  DELIVERED: { label: 'Delivered', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  DELAYED: { label: 'Delayed', color: 'text-red-700', bg: 'bg-red-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-700', bg: 'bg-gray-100' }
};

const OrderTracking = () => {
  const {
    trackings,
    salesOrders,
    loading,
    error,
    fetchTrackings,
    fetchSalesOrders,
    createTracking,
    updateTracking,
    deleteTracking,
    clearError
  } = useSalesStore();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    salesOrderId: '',
    status: 'PENDING',
    carrier: '',
    trackingNumber: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    fetchSalesOrders();
    fetchTrackings();
  }, [fetchSalesOrders, fetchTrackings]);

  const resetForm = () => {
    setFormData({
      salesOrderId: '',
      status: 'PENDING',
      carrier: '',
      trackingNumber: '',
      location: '',
      notes: ''
    });
    setEditing(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData };

    try {
      if (editing) {
        await updateTracking(editing.id, payload);
      } else {
        await createTracking(payload);
      }

      setShowModal(false);
      resetForm();
    } catch (submitError) {
      console.error('Failed to save tracking:', submitError);
    }
  };

  const handleEdit = (tracking) => {
    setEditing(tracking);
    setFormData({
      salesOrderId: tracking.salesOrderId || tracking.order?.id || '',
      status: tracking.status || 'PENDING',
      carrier: tracking.carrier || '',
      trackingNumber: tracking.trackingNumber || '',
      location: tracking.location || '',
      notes: tracking.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this tracking record?')) {
      try {
        await deleteTracking(id);
      } catch (deleteError) {
        console.error('Failed to delete tracking record:', deleteError);
      }
    }
  };

  const orderLabel = (order) => order.orderNumber || order.id.slice(0, 8).toUpperCase();

  const filtered = trackings.filter(t =>
    t.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.order?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.order?.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Order Tracking</h1>
            <p className="text-primary-600 mt-1">Monitor shipment status and delivery updates</p>
          </div>
          <button
            onClick={() => { clearError(); setShowModal(true); }}
            className="btn-modern btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Tracking</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="modern-card-elevated p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tracking number or order..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
        </div>

        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">Tracking Updates ({filtered.length})</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8"><LoadingSpinner /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tracking records found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Tracking</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-primary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-200">
                  {filtered.map((t) => {
                    const status = statusStyles[t.status] || statusStyles.PENDING;
                    return (
                      <tr key={t.id} className="hover:bg-primary-50">
                        <td className="px-6 py-4 text-sm text-primary-900">
                          <div className="font-medium">{t.order ? orderLabel(t.order) : t.salesOrderId?.slice(0, 8).toUpperCase()}</div>
                          <div className="text-xs text-primary-500">{t.order?.customerName || '—'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-primary-700">
                          <div className="font-medium">{t.trackingNumber || '—'}</div>
                          <div className="text-xs text-primary-500">{t.carrier || '—'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-primary-700">{t.location || '—'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(t)}
                              className="p-2 text-primary-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
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
          <div className="modern-card-elevated max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-primary-200">
              <h3 className="text-lg font-semibold text-primary-900">
                {editing ? 'Edit Tracking' : 'New Tracking'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Sales Order</label>
                <select
                  name="salesOrderId"
                  value={formData.salesOrderId}
                  onChange={handleChange}
                  required
                  className="input-modern"
                >
                  <option value="">Select an order</option>
                  {salesOrders.map(order => (
                    <option key={order.id} value={order.id}>
                      {orderLabel(order)} - {order.customerName}
                    </option>
                  ))}
                </select>
              </div>
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
                <label className="block text-sm font-medium text-primary-700 mb-1">Carrier</label>
                <input
                  name="carrier"
                  type="text"
                  value={formData.carrier}
                  onChange={handleChange}
                  className="input-modern"
                  placeholder="Carrier name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Tracking Number</label>
                <input
                  name="trackingNumber"
                  type="text"
                  value={formData.trackingNumber}
                  onChange={handleChange}
                  className="input-modern"
                  placeholder="Tracking number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Location</label>
                <input
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  className="input-modern"
                  placeholder="Current location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="input-modern"
                  placeholder="Additional notes"
                />
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
                  {loading ? 'Saving...' : (editing ? 'Update Tracking' : 'Create Tracking')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default OrderTracking;
