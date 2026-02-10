import React, { useEffect, useState } from 'react';
import { BarChart3, Download, Calendar, DollarSign } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import axios from 'axios';
import { getToken } from '../../store/auth.store';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const AgingReport = () => {
  const [agingData, setAgingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBucket, setSelectedBucket] = useState('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAgingReport();
  }, [asOfDate]);

  const fetchAgingReport = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await axios.get(`${API_URL}/api/ap/aging?asOfDate=${asOfDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgingData(response.data);
    } catch (err) {
      setError('Failed to fetch aging report');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      setExporting(true);
      const token = getToken();
      const response = await axios.get(`${API_URL}/api/ap/aging/export?asOfDate=${asOfDate}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AP-Aging-Report-${asOfDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const getBillsForBucket = (bucket) => {
    if (!agingData || !agingData.bills) return [];
    if (bucket === 'all') {
      return Object.values(agingData.bills).flat();
    }
    return agingData.bills[bucket] || [];
  };

  const filteredBills = getBillsForBucket(selectedBucket);

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (!agingData) return <Layout><div className="p-6">No data available</div></Layout>;

  const { summary } = agingData;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-8 h-8" />
              Accounts Payable Aging Report
            </h1>
            <p className="text-gray-600 mt-1">Outstanding payables by aging period</p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={exportToExcel}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              {exporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div 
            className={`bg-white p-4 rounded-lg shadow cursor-pointer transition ${selectedBucket === 'all' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => setSelectedBucket('all')}
          >
            <p className="text-gray-500 text-sm">Total Outstanding</p>
            <p className="text-2xl font-bold text-gray-800">${agingData.totalOutstanding.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{agingData.totalBills} bills</p>
          </div>

          <div 
            className={`bg-white p-4 rounded-lg shadow cursor-pointer transition ${selectedBucket === 'current' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => setSelectedBucket('current')}
          >
            <p className="text-gray-500 text-sm">Current</p>
            <p className="text-2xl font-bold text-emerald-600">${summary.current.total.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{summary.current.count} bills</p>
          </div>

          <div 
            className={`bg-white p-4 rounded-lg shadow cursor-pointer transition ${selectedBucket === 'days_1_30' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => setSelectedBucket('days_1_30')}
          >
            <p className="text-gray-500 text-sm">1-30 Days</p>
            <p className="text-2xl font-bold text-yellow-600">${summary.days_1_30.total.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{summary.days_1_30.count} bills</p>
          </div>

          <div 
            className={`bg-white p-4 rounded-lg shadow cursor-pointer transition ${selectedBucket === 'days_31_60' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => setSelectedBucket('days_31_60')}
          >
            <p className="text-gray-500 text-sm">31-60 Days</p>
            <p className="text-2xl font-bold text-orange-600">${summary.days_31_60.total.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{summary.days_31_60.count} bills</p>
          </div>

          <div 
            className={`bg-white p-4 rounded-lg shadow cursor-pointer transition ${selectedBucket === 'days_61_90' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => setSelectedBucket('days_61_90')}
          >
            <p className="text-gray-500 text-sm">61-90 Days</p>
            <p className="text-2xl font-bold text-red-600">${summary.days_61_90.total.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{summary.days_61_90.count} bills</p>
          </div>

          <div 
            className={`bg-white p-4 rounded-lg shadow cursor-pointer transition ${selectedBucket === 'days_91_plus' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => setSelectedBucket('days_91_plus')}
          >
            <p className="text-gray-500 text-sm">90+ Days</p>
            <p className="text-2xl font-bold text-red-800">${summary.days_91_plus.total.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{summary.days_91_plus.count} bills</p>
          </div>
        </div>

        {/* Aging Visualization */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Aging Distribution</h2>
          <div className="space-y-3">
            {Object.entries(summary).map(([bucket, data]) => {
              const percentage = agingData.totalOutstanding > 0 
                ? (data.total / agingData.totalOutstanding) * 100 
                : 0;
              
              const bucketLabels = {
                current: 'Current (Not Due)',
                days_1_30: '1-30 Days Overdue',
                days_31_60: '31-60 Days Overdue',
                days_61_90: '61-90 Days Overdue',
                days_91_plus: '90+ Days Overdue'
              };

              const colors = {
                current: 'bg-emerald-500',
                days_1_30: 'bg-yellow-500',
                days_31_60: 'bg-orange-500',
                days_61_90: 'bg-red-500',
                days_91_plus: 'bg-red-800'
              };

              return (
                <div key={bucket} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{bucketLabels[bucket]}</span>
                    <span className="text-gray-600">${data.total.toFixed(2)} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${colors[bucket]} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bills Detail Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedBucket === 'all' ? 'All Bills' : `Bills - ${selectedBucket.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Overdue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No bills in this category
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => {
                    const dueDate = new Date(bill.dueDate);
                    const asOf = new Date(asOfDate);
                    const daysOverdue = Math.floor((asOf - dueDate) / (1000 * 60 * 60 * 24));

                    return (
                      <tr key={bill.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {bill.billNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {bill.vendor?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {bill.invoiceNumber || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(bill.billDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {dueDate.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {daysOverdue < 0 ? (
                            <span className="text-emerald-600 font-medium">
                              Due in {Math.abs(daysOverdue)} days
                            </span>
                          ) : daysOverdue === 0 ? (
                            <span className="text-gray-600 font-medium">Due today</span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              {daysOverdue} days overdue
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ${bill.balanceAmount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan="6" className="px-6 py-3 text-right text-sm font-bold text-gray-800">
                    Total:
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                    ${filteredBills.reduce((sum, bill) => sum + bill.balanceAmount, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Insights</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• {agingData.totalBills} bills totaling ${agingData.totalOutstanding.toFixed(2)} are outstanding</li>
            <li>• {summary.current.count} bills (${summary.current.total.toFixed(2)}) are not yet due</li>
            <li>• {summary.days_1_30.count + summary.days_31_60.count + summary.days_61_90.count + summary.days_91_plus.count} bills are overdue</li>
            {summary.days_91_plus.count > 0 && (
              <li className="text-red-700 font-semibold">
                ⚠ {summary.days_91_plus.count} bills (${summary.days_91_plus.total.toFixed(2)}) are over 90 days overdue
              </li>
            )}
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default AgingReport;
