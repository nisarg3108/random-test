import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { RoleGuard } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ReportsDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const defaultReports = [
    { name: 'Inventory Report', description: 'Current inventory status and valuation', type: 'inventory' },
    { name: 'User Activity Report', description: 'User login and activity tracking', type: 'user_activity' },
    { name: 'Department Report', description: 'Department-wise user distribution', type: 'department' },
    { name: 'System Report', description: 'System health and performance metrics', type: 'system' }
  ];

  const handleGenerateReport = async (reportType) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`${reportType} report generated successfully!`);
    } catch (err) {
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard requiredRole="MANAGER" fallback={
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    }>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
              <p className="text-gray-600 mt-1">Generate and view system reports</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {defaultReports.map((report, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.name}</h3>
                        <p className="text-gray-600 text-sm">{report.description}</p>
                      </div>
                      <div className="text-2xl">📊</div>
                    </div>
                    <button
                      onClick={() => handleGenerateReport(report.name)}
                      disabled={loading}
                      className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      {loading ? 'Generating...' : 'Generate Report'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
              </div>
              <div className="p-6">
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">📄</div>
                  <p>No reports generated yet</p>
                  <p className="text-sm">Generate your first report to see it here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};

export default ReportsDashboard;