import React, { useState } from 'react';
import { Download, Users, Calendar, DollarSign } from 'lucide-react';
import Layout from '../../../components/layout/Layout.jsx';
import { useReportsStore } from '../../../store/reports.store.js';

const HRAnalyticsReport = () => {
  const { generateHRAnalyticsReport, exportReport, loading } = useReportsStore();
  const [reportData, setReportData] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handleGenerate = async () => {
    try {
      const data = await generateHRAnalyticsReport(startDate, endDate);
      setReportData(data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const handleExport = async (format) => {
    try {
      const blob = await exportReport({
        format,
        reportType: 'hr-analytics',
        startDate,
        endDate,
        reportName: 'HR Analytics Report',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hr_analytics.${format === 'excel' ? 'xlsx' : 'pdf'}`;
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
            <h1 className="text-2xl font-bold text-primary-900">HR Analytics</h1>
            <p className="text-primary-600 mt-1">
              Employee, leave, and payroll analytics
            </p>
          </div>
          <Users className="w-8 h-8 text-primary-600" />
        </div>

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

        {reportData && (
          <>
            <div className="flex space-x-3">
              <button onClick={() => handleExport('pdf')} className="btn-modern btn-secondary flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
              <button onClick={() => handleExport('excel')} className="btn-modern btn-secondary flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="modern-card-elevated p-6">
                <Users className="w-8 h-8 text-blue-600 mb-2" />
                <p className="text-sm font-medium text-primary-600">Total Employees</p>
                <p className="text-2xl font-bold text-primary-900 mt-2">
                  {reportData.employees.total}
                </p>
              </div>
              <div className="modern-card-elevated p-6">
                <Calendar className="w-8 h-8 text-green-600 mb-2" />
                <p className="text-sm font-medium text-primary-600">Total Leaves</p>
                <p className="text-2xl font-bold text-primary-900 mt-2">
                  {reportData.leaves.statistics.total}
                </p>
              </div>
              <div className="modern-card-elevated p-6">
                <Calendar className="w-8 h-8 text-yellow-600 mb-2" />
                <p className="text-sm font-medium text-primary-600">Pending Leaves</p>
                <p className="text-2xl font-bold text-primary-900 mt-2">
                  {reportData.leaves.statistics.pending}
                </p>
              </div>
              <div className="modern-card-elevated p-6">
                <DollarSign className="w-8 h-8 text-purple-600 mb-2" />
                <p className="text-sm font-medium text-primary-600">Total Payroll</p>
                <p className="text-2xl font-bold text-primary-900 mt-2">
                  ${reportData.payroll.totalMonthlyPayroll.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="modern-card-elevated p-6">
              <h3 className="font-semibold text-primary-900 mb-4">Department Distribution</h3>
              <div className="space-y-3">
                {Object.entries(reportData.employees.byDepartment).map(([dept, count]) => (
                  <div key={dept} className="flex justify-between p-3 bg-primary-50 rounded">
                    <span>{dept}</span>
                    <span className="font-medium">{count} employees</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modern-card-elevated p-6">
              <h3 className="font-semibold text-primary-900 mb-4">Leave Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded">
                  <p className="text-2xl font-bold text-green-600">
                    {reportData.leaves.statistics.approved}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Approved</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded">
                  <p className="text-2xl font-bold text-yellow-600">
                    {reportData.leaves.statistics.pending}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Pending</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded">
                  <p className="text-2xl font-bold text-red-600">
                    {reportData.leaves.statistics.rejected}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Rejected</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <p className="text-2xl font-bold text-blue-600">
                    {reportData.leaves.statistics.total}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default HRAnalyticsReport;
