import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './Warehouse.css';

export default function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'PENDING',
    type: '',
    search: ''
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchMovements();
  }, [filters]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/stock-movements?${params}`);
      setMovements(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch movements');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/stock-movements/${id}/approve`);
      fetchMovements();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve movement');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.patch(`/stock-movements/${id}/reject`);
      fetchMovements();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject movement');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="stock-movements">
      <div className="list-header">
        <h1>Stock Movements</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Record Movement
        </button>
      </div>

      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="IN">Inbound</option>
          <option value="OUT">Outbound</option>
          <option value="TRANSFER">Transfer</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>

        <input
          type="text"
          placeholder="Search movements..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      {error && <div className="alert-error">{error}</div>}

      <table className="movements-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Item</th>
            <th>Type</th>
            <th>From/To</th>
            <th>Quantity</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {movements.map(m => (
            <tr key={m.id}>
              <td>{m.referenceNumber}</td>
              <td>{m.item?.itemCode} - {m.item?.name}</td>
              <td><span className={`badge ${m.type.toLowerCase()}`}>{m.type}</span></td>
              <td>
                {m.type === 'TRANSFER' 
                  ? `${m.sourceWarehouse?.name} → ${m.targetWarehouse?.name}`
                  : m.warehouse?.name
                }
              </td>
              <td>{m.quantity}</td>
              <td>
                <span className={`status ${m.status.toLowerCase()}`}>
                  {m.status}
                </span>
              </td>
              <td>{new Date(m.createdAt).toLocaleDateString()}</td>
              <td>
                {m.status === 'PENDING' && (
                  <>
                    <button 
                      className="btn-sm btn-success" 
                      onClick={() => handleApprove(m.id)}
                    >
                      Approve
                    </button>
                    <button 
                      className="btn-sm btn-danger" 
                      onClick={() => handleReject(m.id)}
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <MovementForm onClose={() => setShowForm(false)} onSuccess={() => fetchMovements()} />
      )}
    </div>
  );
}

function MovementForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    itemId: '',
    type: 'IN',
    quantity: '',
    warehouseId: '',
    sourceWarehouseId: '',
    targetWarehouseId: '',
    reason: '',
    notes: ''
  });
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLookupData();
  }, []);

  const fetchLookupData = async () => {
    try {
      const [itemsRes, warehousesRes] = await Promise.all([
        api.get('/items'),
        api.get('/warehouses')
      ]);
      setItems(itemsRes.data);
      setWarehouses(warehousesRes.data);
    } catch (err) {
      setError('Failed to load lookup data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/stock-movements', formData);
      setLoading(false);
      onClose();
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create movement');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Record Stock Movement</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>Movement Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="IN">Inbound</option>
                <option value="OUT">Outbound</option>
                <option value="TRANSFER">Transfer</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
            </div>
            <div className="form-group">
              <label>Item *</label>
              <select
                value={formData.itemId}
                onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                required
              >
                <option value="">Select Item</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.itemCode} - {i.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.type === 'TRANSFER' ? (
            <div className="form-row">
              <div className="form-group">
                <label>From Warehouse *</label>
                <select
                  value={formData.sourceWarehouseId}
                  onChange={(e) => setFormData({ ...formData, sourceWarehouseId: e.target.value })}
                  required
                >
                  <option value="">Select Source</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>To Warehouse *</label>
                <select
                  value={formData.targetWarehouseId}
                  onChange={(e) => setFormData({ ...formData, targetWarehouseId: e.target.value })}
                  required
                >
                  <option value="">Select Target</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label>Warehouse *</label>
              <select
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                required
              >
                <option value="">Select Warehouse</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}

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
              <label>Reason</label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              >
                <option value="">Select Reason</option>
                <option value="PURCHASE">Purchase</option>
                <option value="SALE">Sale</option>
                <option value="DAMAGE">Damage</option>
                <option value="LOSS">Loss</option>
                <option value="INVENTORY_COUNT">Inventory Count</option>
              </select>
            </div>
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
              {loading ? 'Recording...' : 'Record Movement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
