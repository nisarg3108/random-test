import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './Warehouse.css';

export default function WarehouseList() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ isActive: true, search: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, [filters]);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.isActive !== null) params.append('isActive', filters.isActive);
      if (filters.search) params.append('search', filters.search);
      
      const response = await api.get(`/warehouses?${params}`);
      setWarehouses(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch warehouses');
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      try {
        await api.delete(`/warehouses/${id}`);
        setWarehouses(warehouses.filter(w => w.id !== id));
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete warehouse');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="warehouse-list">
      <div className="list-header">
        <h1>Warehouse Management</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Add Warehouse
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search warehouses..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select 
          value={filters.isActive} 
          onChange={(e) => setFilters({ ...filters, isActive: e.target.value === 'true' })}
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
          <option value="">All</option>
        </select>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <table className="warehouse-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Type</th>
            <th>Location</th>
            <th>Items</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(warehouses) && warehouses.length > 0 ? (
            warehouses.map(wh => (
              <tr key={wh.id}>
                <td>{wh.code}</td>
                <td>{wh.name}</td>
                <td>{wh.type}</td>
                <td>{wh.city || 'N/A'}</td>
                <td>{wh._count?.stockItems || 0}</td>
                <td>
                  <span className={`status ${wh.isActive ? 'active' : 'inactive'}`}>
                    {wh.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button className="btn-sm btn-info" onClick={() => {}}>View</button>
                  <button className="btn-sm btn-danger" onClick={() => handleDelete(wh.id)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                No warehouses found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showForm && (
        <WarehouseForm onClose={() => setShowForm(false)} onSuccess={() => fetchWarehouses()} />
      )}
    </div>
  );
}

function WarehouseForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'GENERAL',
    address: '',
    city: '',
    state: '',
    country: '',
    capacity: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/warehouses', formData);
      setLoading(false);
      onClose();
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create warehouse');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Warehouse</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="WH001"
                required
              />
            </div>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                <option value="GENERAL">General</option>
                <option value="COLD_STORAGE">Cold Storage</option>
                <option value="HAZARDOUS">Hazardous</option>
                <option value="BONDED">Bonded</option>
              </select>
            </div>
            <div className="form-group">
              <label>Capacity</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Warehouse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
