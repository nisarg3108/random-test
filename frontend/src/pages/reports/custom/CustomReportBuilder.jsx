import React, { useMemo, useState } from 'react';
import { Download, Filter, Plus, Save, BarChart3 } from 'lucide-react';
import Layout from '../../../components/layout/Layout.jsx';
import { useReportsStore } from '../../../store/reports.store.js';

const DATA_SOURCES = {
  employees: {
    label: 'Employees',
    columns: ['id', 'name', 'email', 'phone', 'departmentId', 'designation', 'status', 'joiningDate', 'createdAt'],
    numeric: [],
  },
  inventory: {
    label: 'Inventory Items',
    columns: ['id', 'name', 'sku', 'quantity', 'unitPrice', 'categoryId', 'createdAt'],
    numeric: ['quantity', 'unitPrice'],
  },
  expenses: {
    label: 'Expense Claims',
    columns: ['id', 'title', 'amount', 'status', 'expenseDate', 'categoryId', 'employeeId', 'createdAt'],
    numeric: ['amount'],
  },
  leaves: {
    label: 'Leave Requests',
    columns: ['id', 'status', 'startDate', 'endDate', 'leaveTypeId', 'employeeId', 'createdAt'],
    numeric: [],
  },
};

const CustomReportBuilder = () => {
  const {
    executeCustomReport,
    exportCustomReport,
    saveReport,
    createTemplate,
    loading,
  } = useReportsStore();

  const [dataSource, setDataSource] = useState('employees');
  const [selectedColumns, setSelectedColumns] = useState(['id', 'name', 'email']);
  const [filters, setFilters] = useState([{ field: '', value: '' }]);
  const [aggregations, setAggregations] = useState([{ field: '', operation: 'count' }]);
  const [reportResult, setReportResult] = useState(null);
  const [reportName, setReportName] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const dataSourceConfig = DATA_SOURCES[dataSource];

  const availableColumns = useMemo(() => dataSourceConfig.columns, [dataSourceConfig]);
  const numericColumns = useMemo(() => dataSourceConfig.numeric, [dataSourceConfig]);

  const handleAddFilter = () => setFilters((prev) => [...prev, { field: '', value: '' }]);
  const handleRemoveFilter = (index) => setFilters((prev) => prev.filter((_, i) => i !== index));

  const handleAddAggregation = () =>
    setAggregations((prev) => [...prev, { field: '', operation: 'count' }]);
  const handleRemoveAggregation = (index) =>
    setAggregations((prev) => prev.filter((_, i) => i !== index));

  const buildConfig = () => {
    const filterObject = filters
      .filter((f) => f.field && f.value !== '')
      .reduce((acc, f) => {
        acc[f.field] = f.value;
        return acc;
      }, {});

    const aggList = aggregations
      .filter((a) => a.field && a.operation)
      .map((a) => ({ field: a.field, operation: a.operation }));

    return {
      name: reportName || 'Custom Report',
      dataSource,
      columns: selectedColumns,
      filters: Object.keys(filterObject).length > 0 ? filterObject : undefined,
      aggregations: aggList.length > 0 ? aggList : undefined,
    };
  };

  const handleRunReport = async () => {
    setError('');
    setSuccess('');
    try {
      const config = buildConfig();
      const result = await executeCustomReport(config);
      setReportResult(result);
    } catch (err) {
      setError(err.message || 'Failed to run report');
    }
  };

  const handleExport = async (format) => {
    if (!reportResult) return;
    setError('');
    setSuccess('');
    try {
      const config = buildConfig();
      const blob = await exportCustomReport(config, format, reportName || 'Custom Report');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(reportName || 'custom_report').replace(/\s+/g, '_')}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message || 'Failed to export report');
    }
  };

  const handleSaveReport = async () => {
    if (!reportResult) return;
    setError('');
    setSuccess('');
    try {
      const config = buildConfig();
      await saveReport({
        name: reportName || 'Custom Report',
        type: 'CUSTOM',
        parameters: { config },
        data: reportResult,
      });
      setSuccess('Report saved successfully');
    } catch (err) {
      setError(err.message || 'Failed to save report');
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const config = buildConfig();
      await createTemplate({
        name: templateName.trim(),
        type: 'CUSTOM',
        category: 'CUSTOM',
        description: templateDescription.trim() || null,
        config,
      });
      setSuccess('Template saved successfully');
    } catch (err) {
      setError(err.message || 'Failed to save template');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Custom Report Builder</h1>
            <p className="text-primary-600 mt-1">Create custom reports with filters and aggregations</p>
          </div>
          <BarChart3 className="w-8 h-8 text-primary-600" />
        </div>

        {(error || success) && (
          <div className={`px-4 py-3 rounded-lg border ${error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            {error || success}
          </div>
        )}

        <div className="modern-card-elevated p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">Report Name</label>
              <input
                className="input-modern"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="e.g., Monthly Expense Summary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">Data Source</label>
              <select
                className="input-modern"
                value={dataSource}
                onChange={(e) => {
                  setDataSource(e.target.value);
                  setSelectedColumns(DATA_SOURCES[e.target.value].columns.slice(0, 3));
                }}
              >
                {Object.entries(DATA_SOURCES).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">Columns</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {availableColumns.map((col) => (
                <label key={col} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(col)}
                    onChange={(e) => {
                      setSelectedColumns((prev) =>
                        e.target.checked ? [...prev, col] : prev.filter((c) => c !== col)
                      );
                    }}
                  />
                  <span>{col}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary-800 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filters (exact match)
              </h3>
              <button className="btn-modern btn-secondary" onClick={handleAddFilter}>
                <Plus className="w-4 h-4" />
                <span>Add Filter</span>
              </button>
            </div>
            {filters.map((filter, index) => (
              <div key={`${filter.field}-${index}`} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <select
                  className="input-modern"
                  value={filter.field}
                  onChange={(e) =>
                    setFilters((prev) =>
                      prev.map((f, i) => (i === index ? { ...f, field: e.target.value } : f))
                    )
                  }
                >
                  <option value="">Select field</option>
                  {availableColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <input
                  className="input-modern md:col-span-3"
                  value={filter.value}
                  onChange={(e) =>
                    setFilters((prev) =>
                      prev.map((f, i) => (i === index ? { ...f, value: e.target.value } : f))
                    )
                  }
                  placeholder="Value"
                />
                <button
                  className="btn-modern btn-secondary"
                  onClick={() => handleRemoveFilter(index)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary-800">Aggregations</h3>
              <button className="btn-modern btn-secondary" onClick={handleAddAggregation}>
                <Plus className="w-4 h-4" />
                <span>Add Aggregation</span>
              </button>
            </div>
            {aggregations.map((agg, index) => (
              <div key={`${agg.field}-${index}`} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <select
                  className="input-modern"
                  value={agg.field}
                  onChange={(e) =>
                    setAggregations((prev) =>
                      prev.map((a, i) => (i === index ? { ...a, field: e.target.value } : a))
                    )
                  }
                >
                  <option value="">Select field</option>
                  {[...new Set([...availableColumns, ...numericColumns])].map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <select
                  className="input-modern"
                  value={agg.operation}
                  onChange={(e) =>
                    setAggregations((prev) =>
                      prev.map((a, i) => (i === index ? { ...a, operation: e.target.value } : a))
                    )
                  }
                >
                  <option value="count">count</option>
                  <option value="sum">sum</option>
                  <option value="avg">avg</option>
                  <option value="min">min</option>
                  <option value="max">max</option>
                </select>
                <button
                  className="btn-modern btn-secondary md:col-span-2"
                  onClick={() => handleRemoveAggregation(index)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRunReport}
              disabled={loading}
              className="btn-modern btn-primary"
            >
              {loading ? 'Running...' : 'Run Report'}
            </button>
            <button
              onClick={handleSaveReport}
              disabled={!reportResult || loading}
              className="btn-modern btn-secondary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Report</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={!reportResult || loading}
              className="btn-modern btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={!reportResult || loading}
              className="btn-modern btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        <div className="modern-card-elevated p-6 space-y-4">
          <h3 className="text-lg font-semibold text-primary-900">Save as Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              className="input-modern"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
            />
            <input
              className="input-modern md:col-span-2"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Description (optional)"
            />
          </div>
          <button
            onClick={handleSaveTemplate}
            disabled={loading}
            className="btn-modern btn-secondary"
          >
            <Save className="w-4 h-4" />
            <span>Save Template</span>
          </button>
        </div>

        {reportResult && (
          <div className="modern-card-elevated">
            <div className="p-6 border-b border-primary-200">
              <h3 className="text-lg font-semibold text-primary-900">Report Results</h3>
              <p className="text-sm text-primary-600 mt-1">Total Records: {reportResult.totalRecords}</p>
            </div>
            <div className="p-6">
              {reportResult.aggregations && Object.keys(reportResult.aggregations).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {Object.entries(reportResult.aggregations).map(([key, value]) => (
                    <div key={key} className="bg-primary-50 rounded-lg p-4">
                      <p className="text-xs text-primary-600">{key}</p>
                      <p className="text-lg font-semibold text-primary-900">{Number.isFinite(value) ? value.toLocaleString() : value}</p>
                    </div>
                  ))}
                </div>
              )}

              {reportResult.data?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(reportResult.data[0]).map((key) => (
                          <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportResult.data.map((row, idx) => (
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
              ) : (
                <div className="text-center py-8 text-gray-500">No results found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CustomReportBuilder;
