import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './Warehouse.css';

export default function WarehouseDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchDashboard(selectedWarehouse);
    }
  }, [selectedWarehouse]);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data);
      if (response.data.length > 0) {
        setSelectedWarehouse(response.data[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch warehouses');
    }
  };

  const fetchDashboard = async (warehouseId) => {
    try {
      setLoading(true);
      const response = await api.get(`/warehouses/${warehouseId}/dashboard`);
      setDashboard(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!dashboard) return <div>No warehouse selected</div>;

  const utilization = dashboard.currentStock ? 
    Math.round((dashboard.currentStock / (dashboard.capacity || 1)) * 100) : 0;

  return (
    <div className="warehouse-dashboard">
      <div className="dashboard-header">
        <h1>Warehouse Dashboard</h1>
        <select 
          value={selectedWarehouse || ''} 
          onChange={(e) => setSelectedWarehouse(e.target.value)}
          className="warehouse-selector"
        >
          <option value="">Select Warehouse</option>
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="dashboard-grid">
        <div className="card metric-card">
          <h3>Total Items</h3>
          <div className="metric-value">{dashboard.totalItems || 0}</div>
          <p className="metric-label">Distinct SKUs</p>
        </div>

        <div className="card metric-card">
          <h3>Current Stock</h3>
          <div className="metric-value">{dashboard.currentStock || 0}</div>
          <p className="metric-label">Total Units</p>
        </div>

        <div className="card metric-card">
          <h3>Capacity Utilization</h3>
          <div className="metric-value">{utilization}%</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${utilization}%` }}></div>
          </div>
        </div>

        <div className="card metric-card">
          <h3>Stock Value</h3>
          <div className="metric-value">₹{(dashboard.totalValue || 0).toLocaleString('en-IN')}</div>
          <p className="metric-label">Total Inventory Value</p>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="card">
          <h3>Recent Movements</h3>
          <table className="movement-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentMovements?.slice(0, 5).map((m, idx) => (
                <tr key={idx}>
                  <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                  <td>{m.itemCode}</td>
                  <td><span className={`badge ${m.type.toLowerCase()}`}>{m.type}</span></td>
                  <td>{m.quantity}</td>
                  <td><span className={`status ${m.status.toLowerCase()}`}>{m.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Low Stock Items</h3>
          <table className="items-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Current Stock</th>
                <th>Min Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.lowStockItems?.slice(0, 5).map((item, idx) => (
                <tr key={idx} className="low-stock-row">
                  <td>{item.itemCode}</td>
                  <td>{item.currentQuantity}</td>
                  <td>{item.minimumQuantity}</td>
                  <td>
                    <span className="badge alert">Low Stock</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Stock by Category</h3>
        <table className="category-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Items</th>
              <th>Total Quantity</th>
              <th>Value</th>
              <th>% of Total</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.stockByCategory?.map((cat, idx) => (
              <tr key={idx}>
                <td>{cat.category}</td>
                <td>{cat.itemCount}</td>
                <td>{cat.totalQuantity}</td>
                <td>₹{cat.value.toLocaleString('en-IN')}</td>
                <td>{cat.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
