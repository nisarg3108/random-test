import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './Manufacturing.css';

export default function BOMList() {
  const [boms, setBOMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'ACTIVE',
    search: ''
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchBOMs();
  }, [filters]);

  const fetchBOMs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/manufacturing/bom?${params}`);
      setBOMs(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch BOMs');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/manufacturing/bom/${id}/set-default`);
      fetchBOMs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set default');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure? This will archive the BOM.')) {
      try {
        await api.patch(`/manufacturing/bom/${id}/archive`);
        fetchBOMs();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to archive BOM');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bom-list">
      <div className="list-header">
        <h1>Bills of Material</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Create BOM
        </button>
      </div>

      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        <input
          type="text"
          placeholder="Search BOMs..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      {error && <div className="alert-error">{error}</div>}

      <table className="bom-table">
        <thead>
          <tr>
            <th>BOM Number</th>
            <th>Product</th>
            <th>Version</th>
            <th>Items</th>
            <th>Est. Cost</th>
            <th>Status</th>
            <th>Default</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {boms.map(bom => (
            <tr key={bom.id}>
              <td>{bom.bomNumber}</td>
              <td>{bom.product?.name}</td>
              <td>v{bom.version}</td>
              <td>{bom._count?.items || 0}</td>
              <td>₹{(bom.estimatedCost || 0).toLocaleString('en-IN')}</td>
              <td>
                <span className={`status ${bom.status.toLowerCase()}`}>
                  {bom.status}
                </span>
              </td>
              <td>
                {bom.isDefault ? (
                  <span className="badge success">Yes</span>
                ) : (
                  <button
                    className="btn-sm btn-info"
                    onClick={() => handleSetDefault(bom.id)}
                  >
                    Set Default
                  </button>
                )}
              </td>
              <td>
                <button className="btn-sm btn-info">View</button>
                {bom.status !== 'ARCHIVED' && (
                  <>
                    <button className="btn-sm btn-primary">Edit</button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => handleDelete(bom.id)}
                    >
                      Archive
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <BOMForm onClose={() => setShowForm(false)} onSuccess={() => fetchBOMs()} />
      )}
    </div>
  );
}

function BOMForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    bomNumber: '',
    productId: '',
    version: '1',
    description: '',
    items: [{ itemId: '', quantity: '', unitCost: '' }]
  });
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLookupData();
  }, []);

  const fetchLookupData = async () => {
    try {
      const [productsRes, itemsRes] = await Promise.all([
        api.get('/products'),
        api.get('/items')
      ]);
      setProducts(productsRes.data);
      setItems(itemsRes.data);
    } catch (err) {
      setError('Failed to load lookup data');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemId: '', quantity: '', unitCost: '' }]
    });
  };

  const removeItem = (idx) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== idx)
    });
  };

  const updateItem = (idx, field, value) => {
    const newItems = [...formData.items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/manufacturing/bom', formData);
      setLoading(false);
      onClose();
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create BOM');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Bill of Material</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>BOM Number *</label>
              <input
                type="text"
                value={formData.bomNumber}
                onChange={(e) => setFormData({ ...formData, bomNumber: e.target.value })}
                placeholder="BOM-001"
                required
              />
            </div>
            <div className="form-group">
              <label>Product *</label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                required
              >
                <option value="">Select Product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="2"
            />
          </div>

          <div className="form-group">
            <label>Bill of Material Items</label>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Cost</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, idx) => {
                  const itemData = items.find(i => i.id === item.itemId);
                  const total = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0);
                  return (
                    <tr key={idx}>
                      <td>
                        <select
                          value={item.itemId}
                          onChange={(e) => updateItem(idx, 'itemId', e.target.value)}
                          required
                        >
                          <option value="">Select Item</option>
                          {items.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.itemCode} - {i.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(e) => updateItem(idx, 'unitCost', e.target.value)}
                          required
                        />
                      </td>
                      <td>₹{total.toLocaleString('en-IN')}</td>
                      <td>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            className="btn-sm btn-danger"
                            onClick={() => removeItem(idx)}
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button type="button" className="btn-secondary" onClick={addItem}>
              Add Item
            </button>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create BOM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
