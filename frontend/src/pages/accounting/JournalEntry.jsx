import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './Accounting.css';

export default function JournalEntry() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    fromDate: '',
    toDate: '',
    search: ''
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, [filters]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/accounting/journal-entries?${params}`);
      setEntries(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (id) => {
    try {
      await api.patch(`/accounting/journal-entries/${id}/post`);
      fetchEntries();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post entry');
    }
  };

  const handleReverse = async (id) => {
    if (window.confirm('This will create a reversing entry. Continue?')) {
      try {
        await api.patch(`/accounting/journal-entries/${id}/reverse`);
        fetchEntries();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to reverse entry');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="journal-entries">
      <div className="list-header">
        <h1>Journal Entries</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          New Entry
        </button>
      </div>

      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="POSTED">Posted</option>
          <option value="REVERSED">Reversed</option>
        </select>

        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
          placeholder="From Date"
        />

        <input
          type="date"
          value={filters.toDate}
          onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
          placeholder="To Date"
        />

        <input
          type="text"
          placeholder="Search entries..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="entries-list">
        {entries.map(entry => (
          <JournalEntryCard
            key={entry.id}
            entry={entry}
            onPost={() => handlePost(entry.id)}
            onReverse={() => handleReverse(entry.id)}
          />
        ))}
      </div>

      {showForm && (
        <JournalEntryForm 
          onClose={() => setShowForm(false)} 
          onSuccess={() => fetchEntries()} 
        />
      )}
    </div>
  );
}

function JournalEntryCard({ entry, onPost, onReverse }) {
  const totalDebit = entry.lines?.reduce((sum, l) => sum + (l.debitAmount || 0), 0) || 0;
  const totalCredit = entry.lines?.reduce((sum, l) => sum + (l.creditAmount || 0), 0) || 0;
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="journal-entry-card card">
      <div className="entry-header">
        <div>
          <h3>{entry.referenceNumber}</h3>
          <p>{entry.description}</p>
        </div>
        <div className="entry-meta">
          <span className={`status ${entry.status.toLowerCase()}`}>{entry.status}</span>
          <span className="date">{new Date(entry.transactionDate).toLocaleDateString()}</span>
        </div>
      </div>

      <table className="entry-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Description</th>
            <th>Debit</th>
            <th>Credit</th>
          </tr>
        </thead>
        <tbody>
          {entry.lines?.map((line, idx) => (
            <tr key={idx}>
              <td>{line.account?.accountNumber} - {line.account?.name}</td>
              <td>{line.description}</td>
              <td className={line.debitAmount > 0 ? 'amount debit' : ''}>
                {line.debitAmount > 0 ? `₹${line.debitAmount.toLocaleString('en-IN')}` : '-'}
              </td>
              <td className={line.creditAmount > 0 ? 'amount credit' : ''}>
                {line.creditAmount > 0 ? `₹${line.creditAmount.toLocaleString('en-IN')}` : '-'}
              </td>
            </tr>
          ))}
          <tr className="totals-row">
            <td colSpan="2"><strong>Totals</strong></td>
            <td className="amount debit">
              <strong>₹{totalDebit.toLocaleString('en-IN')}</strong>
            </td>
            <td className="amount credit">
              <strong>₹{totalCredit.toLocaleString('en-IN')}</strong>
            </td>
          </tr>
          <tr className={`balance-row ${balanced ? 'balanced' : 'unbalanced'}`}>
            <td colSpan="2">
              <strong>{balanced ? '✓ Balanced' : '✗ Unbalanced'}</strong>
            </td>
            <td colSpan="2"></td>
          </tr>
        </tbody>
      </table>

      <div className="entry-actions">
        {entry.status === 'DRAFT' && (
          <>
            <button className="btn-sm btn-success" onClick={onPost}>Post</button>
            <button className="btn-sm btn-info">Edit</button>
            <button className="btn-sm btn-danger">Delete</button>
          </>
        )}
        {entry.status === 'POSTED' && (
          <button className="btn-sm btn-warning" onClick={onReverse}>Reverse</button>
        )}
      </div>
    </div>
  );
}

function JournalEntryForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    referenceNumber: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
    lines: [{ accountId: '', debitAmount: '', creditAmount: '', description: '' }]
  });
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounting/chart-of-accounts');
      setAccounts(response.data);
    } catch (err) {
      setError('Failed to load accounts');
    }
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { accountId: '', debitAmount: '', creditAmount: '', description: '' }]
    });
  };

  const removeLine = (idx) => {
    setFormData({
      ...formData,
      lines: formData.lines.filter((_, i) => i !== idx)
    });
  };

  const updateLine = (idx, field, value) => {
    const newLines = [...formData.lines];
    newLines[idx] = { ...newLines[idx], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/accounting/journal-entries', formData);
      setLoading(false);
      onClose();
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create entry');
      setLoading(false);
    }
  };

  const totalDebit = formData.lines.reduce((sum, l) => sum + (parseFloat(l.debitAmount) || 0), 0);
  const totalCredit = formData.lines.reduce((sum, l) => sum + (parseFloat(l.creditAmount) || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Journal Entry</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>Reference Number</label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                placeholder="JE-001"
              />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={formData.transactionDate}
                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              />
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
            <label>Journal Lines</label>
            <table className="lines-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Description</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {formData.lines.map((line, idx) => (
                  <tr key={idx}>
                    <td>
                      <select
                        value={line.accountId}
                        onChange={(e) => updateLine(idx, 'accountId', e.target.value)}
                        required
                      >
                        <option value="">Select Account</option>
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.accountNumber} - {a.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => updateLine(idx, 'description', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={line.debitAmount}
                        onChange={(e) => updateLine(idx, 'debitAmount', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={line.creditAmount}
                        onChange={(e) => updateLine(idx, 'creditAmount', e.target.value)}
                      />
                    </td>
                    <td>
                      {formData.lines.length > 1 && (
                        <button
                          type="button"
                          className="btn-sm btn-danger"
                          onClick={() => removeLine(idx)}
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="totals-row">
                  <td colSpan="2"><strong>Totals</strong></td>
                  <td><strong>₹{totalDebit.toLocaleString('en-IN')}</strong></td>
                  <td><strong>₹{totalCredit.toLocaleString('en-IN')}</strong></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <button type="button" className="btn-secondary" onClick={addLine}>
              Add Line
            </button>
            {!balanced && (
              <div className="alert-warning">
                Entry is not balanced. Debits must equal Credits.
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || !balanced}>
              {loading ? 'Creating...' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
