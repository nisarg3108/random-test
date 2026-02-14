import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './Accounting.css';

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAccounts, setExpandedAccounts] = useState(new Set());
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounting/chart-of-accounts');
      setAccounts(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAccounts(newExpanded);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure? This will affect all transactions.')) {
      try {
        await api.delete(`/accounting/chart-of-accounts/${id}`);
        fetchAccounts();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete account');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  // Build hierarchy tree
  const buildTree = (accounts, parentId = null) => {
    if (!Array.isArray(accounts)) return [];
    return accounts.filter(a => a.parentAccountId === parentId).map(account => ({
      ...account,
      children: buildTree(accounts, account.id)
    }));
  };

  const tree = buildTree(accounts);

  return (
    <div className="chart-of-accounts">
      <div className="list-header">
        <h1>Chart of Accounts</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Add Account
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="accounts-tree">
        {Array.isArray(tree) && tree.length > 0 ? (
          tree.map(account => (
            <AccountNode
              key={account.id}
              account={account}
              expanded={expandedAccounts.has(account.id)}
              onToggleExpand={toggleExpand}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            No accounts found. Click "Add Account" to create one.
          </div>
        )}
      </div>

      {showForm && (
        <AccountForm 
          parentAccounts={accounts}
          onClose={() => setShowForm(false)} 
          onSuccess={() => fetchAccounts()} 
        />
      )}
    </div>
  );
}

function AccountNode({ account, expanded, onToggleExpand, onDelete }) {
  const hasChildren = account.children && account.children.length > 0;
  const typeColor = {
    'ASSET': 'blue',
    'LIABILITY': 'red',
    'EQUITY': 'green',
    'REVENUE': 'green',
    'EXPENSE': 'red'
  };

  return (
    <div className="account-node" style={{ marginLeft: `${account.level * 20}px` }}>
      <div className="account-row">
        {hasChildren && (
          <button
            className={`expand-btn ${expanded ? 'expanded' : ''}`}
            onClick={() => onToggleExpand(account.id)}
          >
            ▶
          </button>
        )}
        {!hasChildren && <span className="expand-placeholder"></span>}

        <span className={`account-type ${typeColor[account.type]}`}>
          {account.type}
        </span>
        <span className="account-code">{account.accountNumber}</span>
        <span className="account-name">{account.name}</span>
        <span className="account-balance">
          ₹{(account.balance || 0).toLocaleString('en-IN')}
        </span>

        <button className="btn-sm btn-info">Edit</button>
        <button className="btn-sm btn-danger" onClick={() => onDelete(account.id)}>
          Delete
        </button>
      </div>

      {expanded && hasChildren && (
        <div className="account-children">
          {account.children.map(child => (
            <AccountNode
              key={child.id}
              account={child}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AccountForm({ parentAccounts, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    accountNumber: '',
    name: '',
    type: 'ASSET',
    parentAccountId: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/accounting/chart-of-accounts', formData);
      setLoading(false);
      onClose();
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
      setLoading(false);
    }
  };

  const typeOptions = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Account</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>Account Number *</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="1000"
                required
              />
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                {typeOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
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

          <div className="form-group">
            <label>Parent Account</label>
            <select
              value={formData.parentAccountId}
              onChange={(e) => setFormData({ ...formData, parentAccountId: e.target.value })}
            >
              <option value="">No Parent</option>
              {Array.isArray(parentAccounts) && parentAccounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.accountNumber} - {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
