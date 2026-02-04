import React, { useState } from 'react';
import { Download, TrendingUp, DollarSign } from 'lucide-react';
import Layout from '../../../components/layout/Layout.jsx';
import { useReportsStore } from '../../../store/reports.store.js';

const ProfitLossReport = () => {
  const { generateProfitLossReport, exportReport, loading } = useReportsStore();
  const [reportData, setReportData] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handleGenerate = async () => {
    try {
      const data = await generateProfitLossReport(startDate, endDate);
      setReportData(data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const handleExport = async (format) => {
    try {
      const blob = await exportReport({
        format,
        reportType: 'profit-loss',
        startDate,
        endDate,
        reportName: 'Profit & Loss Report',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profit_loss_report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">
              Profit & Loss Statement
            </h1>
            <p className="text-primary-600 mt-1">
              View revenue, expenses, and net profit/loss
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-primary-600" />
        </div>

        {/* Filters */}
        <div className="modern-card-elevated p-6">
          <h3 className="font-semibold text-primary-900 mb-4">Report Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-modern"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-modern"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-modern btn-primary w-full"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Report Data */}
        {reportData && (
          <>
            {/* Export Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => handleExport('pdf')}
                disabled={loading}
                className="btn-modern btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
              <button
                onClick={() => handleExport('excel')}
                disabled={loading}
                className="btn-modern btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="modern-card-elevated p-6">
                <p className="text-sm font-medium text-primary-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-primary-900 mt-2">
                  ${reportData.revenue.total.toLocaleString()}
                </p>
              </div>
              <div className="modern-card-elevated p-6">
                <p className="text-sm font-medium text-primary-600">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-primary-900 mt-2">
                  ${reportData.expenses.total.toLocaleString()}
                </p>
              </div>
              <div className={`modern-card-elevated p-6 ${
                reportData.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <p className="text-sm font-medium text-primary-600">
                  Net Profit/Loss
                </p>
                <p className={`text-2xl font-bold mt-2 ${
                  reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${reportData.netProfit.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="modern-card-elevated">
              <div className="p-6 border-b border-primary-200">
                <h3 className="font-semibold text-primary-900">
                  Expense Breakdown
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {Object.entries(reportData.expenses.breakdown).map(
                    ([category, amount]) => (
                      <div
                        key={category}
                        className="flex items-center justify-between p-4 bg-primary-50 rounded-lg"
                      >
                        <span className="font-medium text-primary-900">
                          {category}
                        </span>
                        <span className="text-primary-900">
                          ${amount.toLocaleString()}
                        </span>
                      </div>
                    )
                  )}
                  {Object.keys(reportData.expenses.breakdown).length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No expenses recorded for this period
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ProfitLossReport;
