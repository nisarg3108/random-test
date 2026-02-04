import React, { useState } from 'react';
import { Download, Scale } from 'lucide-react';
import Layout from '../../../components/layout/Layout.jsx';
import { useReportsStore } from '../../../store/reports.store.js';

const BalanceSheetReport = () => {
  const { generateBalanceSheetReport, exportReport, loading } = useReportsStore();
  const [reportData, setReportData] = useState(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const handleGenerate = async () => {
    try {
      const data = await generateBalanceSheetReport(asOfDate);
      setReportData(data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const handleExport = async (format) => {
    try {
      const blob = await exportReport({
        format,
        reportType: 'balance-sheet',
        asOfDate,
        reportName: 'Balance Sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `balance_sheet.${format === 'excel' ? 'xlsx' : 'pdf'}`;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Balance Sheet</h1>
            <p className="text-primary-600 mt-1">
              Assets, liabilities, and equity statement
            </p>
          </div>
          <Scale className="w-8 h-8 text-primary-600" />
        </div>

        <div className="modern-card-elevated p-6">
          <h3 className="font-semibold text-primary-900 mb-4">As Of Date</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
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

        {reportData && (
          <>
            <div className="flex space-x-3">
              <button
                onClick={() => handleExport('pdf')}
                className="btn-modern btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="btn-modern btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="modern-card-elevated p-6 bg-green-50">
                <p className="text-sm font-medium text-primary-600">Total Assets</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  ${reportData.assets.total.toLocaleString()}
                </p>
              </div>
              <div className="modern-card-elevated p-6 bg-red-50">
                <p className="text-sm font-medium text-primary-600">Total Liabilities</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  ${reportData.liabilities.total.toLocaleString()}
                </p>
              </div>
              <div className="modern-card-elevated p-6 bg-blue-50">
                <p className="text-sm font-medium text-primary-600">Total Equity</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  ${reportData.equity.total.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="modern-card-elevated p-6">
              <h3 className="font-semibold text-primary-900 mb-4">Assets</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span>Inventory</span>
                  <span>${reportData.assets.current.inventory.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span>Fixed Assets</span>
                  <span>${reportData.assets.fixed.equipment.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default BalanceSheetReport;
