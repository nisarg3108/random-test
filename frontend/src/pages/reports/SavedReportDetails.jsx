import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import Layout from '../../components/layout/Layout.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import * as reportsApi from '../../api/reports.api.js';
import { useReportsStore } from '../../store/reports.store.js';

const SavedReportDetails = () => {
  const { id } = useParams();
  const { exportCustomReport, exportReport } = useReportsStore();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await reportsApi.getSavedReport(id);
        setReport(data);
      } catch (err) {
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const handleExport = async (format) => {
    if (!report) return;
    try {
      if (report.type === 'CUSTOM' && report.parameters?.config) {
        const blob = await exportCustomReport(
          report.parameters.config,
          format,
          report.name
        );
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.name.replace(/\s+/g, '_')}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }

      const reportTypeMap = {
        FINANCIAL: report.parameters?.reportType,
        HR: 'hr-analytics',
        INVENTORY: 'inventory',
      };

      const reportType = reportTypeMap[report.type] || report.parameters?.reportType;
      if (!reportType) return;

      const blob = await exportReport({
        format,
        reportType,
        reportName: report.name,
        ...(report.parameters || {}),
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name.replace(/\s+/g, '_')}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message || 'Failed to export report');
    }
  };

  const renderReportData = () => {
    const dataPayload = report?.data;
    if (!dataPayload) {
      return <div className="text-center py-8 text-gray-500">No data available</div>;
    }

    const tableData = Array.isArray(dataPayload?.data) ? dataPayload.data : null;

    if (tableData && tableData.length > 0) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {Object.keys(tableData[0]).map((key) => (
                  <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((value, i) => (
                    <td key={i} className="px-4 py-2 text-sm text-gray-700">
                      {value === null || value === undefined ? '—' : String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <pre className="bg-gray-50 rounded-lg p-4 text-xs text-gray-700 overflow-auto">
        {JSON.stringify(dataPayload, null, 2)}
      </pre>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout>
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Report not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">{report.name}</h1>
            <p className="text-primary-600 mt-1">
              {report.type} • {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-3">
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
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg border bg-red-50 border-red-200 text-red-700">
            {error}
          </div>
        )}

        <div className="modern-card-elevated">
          <div className="p-6 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">Report Data</h2>
          </div>
          <div className="p-6">{renderReportData()}</div>
        </div>
      </div>
    </Layout>
  );
};

export default SavedReportDetails;
