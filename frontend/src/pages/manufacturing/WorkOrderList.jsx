import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './Manufacturing.css';

export default function WorkOrderList() {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'IN_PROGRESS',
    search: ''
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchWorkOrders();
  }, [filters]);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/manufacturing/work-orders?${params}`);
      setWorkOrders(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch work orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/manufacturing/work-orders/${id}/status`, { status: newStatus });
      fetchWorkOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="work-order-list">
      <div className="list-header">
        <h1>Work Orders</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Create Work Order
        </button>
      </div>

      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PLANNED">Planned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <input
          type="text"
          placeholder="Search work orders..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      {error && <div className="alert-error">{error}</div>}

      <table className="work-order-table">
        <thead>
          <tr>
            <th>WO Number</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Status</th>
            <th>Start Date</th>
            <th>Target Completion</th>
            <th>Operations</th>
            <th>Progress</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {workOrders.map(wo => {
            const progressPct = wo._count?.completedOperations 
              ? Math.round((wo._count.completedOperations / wo._count.totalOperations) * 100)
              : 0;

            return (
              <tr key={wo.id}>
                <td>{wo.workOrderNumber}</td>
                <td>{wo.product?.name}</td>
                <td>{wo.quantity}</td>
                <td>
                  <span className={`status ${wo.status.toLowerCase()}`}>
                    {wo.status}
                  </span>
                </td>
                <td>{wo.startDate ? new Date(wo.startDate).toLocaleDateString() : '-'}</td>
                <td>{new Date(wo.targetCompletionDate).toLocaleDateString()}</td>
                <td>{wo._count?.operations || 0}</td>
                <td>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progressPct}%` }}></div>
                  </div>
                  <span className="progress-text">{progressPct}%</span>
                </td>
                <td>
                  <button className="btn-sm btn-info">View</button>
                  {wo.status === 'DRAFT' && (
                    <button
                      className="btn-sm btn-primary"
                      onClick={() => handleStatusChange(wo.id, 'PLANNED')}
                    >
                      Plan
                    </button>
                  )}
                  {wo.status === 'PLANNED' && (
                    <button
                      className="btn-sm btn-success"
                      onClick={() => handleStatusChange(wo.id, 'IN_PROGRESS')}
                    >
                      Start
                    </button>
                  )}
                  {wo.status === 'IN_PROGRESS' && (
                    <button
                      className="btn-sm btn-success"
                      onClick={() => handleStatusChange(wo.id, 'COMPLETED')}
                    >
                      Complete
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {showForm && (
        <WorkOrderForm onClose={() => setShowForm(false)} onSuccess={() => fetchWorkOrders()} />
      )}
    </div>
  );
}

function WorkOrderForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    workOrderNumber: '',
    bomId: '',
    quantity: '',
    targetCompletionDate: '',
    priority: 'NORMAL',
    notes: ''
  });
  const [boms, setBOMs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBOMs();
  }, []);

  const fetchBOMs = async () => {
    try {
      const response = await api.get('/manufacturing/bom');
      setBOMs(response.data.filter(b => b.status === 'ACTIVE'));
    } catch (err) {
      setError('Failed to load BOMs');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/manufacturing/work-orders', formData);
      setLoading(false);
      onClose();
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create work order');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Work Order</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>WO Number *</label>
              <input
                type="text"
                value={formData.workOrderNumber}
                onChange={(e) => setFormData({ ...formData, workOrderNumber: e.target.value })}
                placeholder="WO-001"
                required
              />
            </div>
            <div className="form-group">
              <label>BOM *</label>
              <select
                value={formData.bomId}
                onChange={(e) => setFormData({ ...formData, bomId: e.target.value })}
                required
              >
                <option value="">Select BOM</option>
                {boms.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bomNumber} - {b.product?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Target Completion Date</label>
              <input
                type="date"
                value={formData.targetCompletionDate}
                onChange={(e) => setFormData({ ...formData, targetCompletionDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
