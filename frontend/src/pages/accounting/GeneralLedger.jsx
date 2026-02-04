import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './Accounting.css';

export default function GeneralLedger() {
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [filters, setFilters] = useState({
    accountId: '',
    fromDate: '',
    toDate: '',
    status: ''
  });
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchAccounts();
    fetchLedger();
  }, [filters]);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounting/chart-of-accounts');
      setAccounts(response.data);
    } catch (err) {
      console.error('Failed to fetch accounts');
    }
  };

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.accountId) params.append('accountId', filters.accountId);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/accounting/general-ledger?${params}`);
      setLedgerEntries(response.data.entries);
      setSummary(response.data.summary);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch ledger');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const totalDebit = summary?.totalDebit || 0;
  const totalCredit = summary?.totalCredit || 0;
  const balance = totalDebit - totalCredit;

  return (
    <div className="general-ledger">
      <h1>General Ledger</h1>

      <div className="filter-section">
        <div className="filters">
          <div className="form-group">
            <label>Account</label>
            <select
              value={filters.accountId}
              onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
            >
              <option value="">All Accounts</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.accountNumber} - {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>From Date</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>To Date</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All</option>
              <option value="POSTED">Posted</option>
              <option value="PENDING">Pending</option>
              <option value="REVERSED">Reversed</option>
            </select>
          </div>
        </div>

        {summary && (
          <div className="summary-cards">
            <div className="card">
              <h4>Total Debits</h4>
              <div className="amount debit">₹{totalDebit.toLocaleString('en-IN')}</div>
            </div>
            <div className="card">
              <h4>Total Credits</h4>
              <div className="amount credit">₹{totalCredit.toLocaleString('en-IN')}</div>
            </div>
            <div className="card">
              <h4>Balance</h4>
              <div className={`amount ${balance >= 0 ? 'debit' : 'credit'}`}>
                ₹{Math.abs(balance).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="card">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference</th>
              <th>Description</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ledgerEntries.map((entry, idx) => (
              <tr key={idx}>
                <td>{new Date(entry.transactionDate).toLocaleDateString()}</td>
                <td>{entry.referenceNumber}</td>
                <td>{entry.description}</td>
                <td className={entry.debitAmount > 0 ? 'amount debit' : ''}>
                  {entry.debitAmount > 0 ? `₹${entry.debitAmount.toLocaleString('en-IN')}` : '-'}
                </td>
                <td className={entry.creditAmount > 0 ? 'amount credit' : ''}>
                  {entry.creditAmount > 0 ? `₹${entry.creditAmount.toLocaleString('en-IN')}` : '-'}
                </td>
                <td className={`amount ${entry.balance >= 0 ? 'debit' : 'credit'}`}>
                  ₹{Math.abs(entry.balance).toLocaleString('en-IN')}
                </td>
                <td>
                  <span className={`status ${entry.status.toLowerCase()}`}>
                    {entry.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
