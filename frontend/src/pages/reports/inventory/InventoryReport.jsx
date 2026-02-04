import React, { useEffect, useState } from 'react';
import { Download, Package, AlertTriangle } from 'lucide-react';
import Layout from '../../../components/layout/Layout.jsx';
import { useReportsStore } from '../../../store/reports.store.js';

const InventoryReport = () => {
  const { generateInventoryReport, exportReport, loading } = useReportsStore();
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    handleGenerate();
  }, []);

  const handleGenerate = async () => {
    try {
      const data = await generateInventoryReport();
      setReportData(data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const handleExport = async (format) => {
    try {
      const blob = await exportReport({
        format,
        reportType: 'inventory',
        reportName: 'Inventory Report',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
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
            <h1 className="text-2xl font-bold text-primary-900">Inventory Report</h1>
            <p className="text-primary-600 mt-1">
              Stock levels, valuations, and alerts
            </p>
          </div>
          <Package className="w-8 h-8 text-primary-600" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : reportData && (
          <>
            <div className="flex space-x-3">
              <button onClick={handleGenerate} className="btn-modern btn-primary">
                Refresh Report
              </button>
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
                <p className="text-sm font-medium text-primary-600">Total Items</p>
                <p className="text-2xl font-bold text-primary-900 mt-2">
                  {reportData.summary.totalItems}
                </p>
              </div>
              <div className="modern-card-elevated p-6">
                <p className="text-sm font-medium text-primary-600">Total Quantity</p>
                <p className="text-2xl font-bold text-primary-900 mt-2">
                  {reportData.summary.totalQuantity.toLocaleString()}
                </p>
              </div>
              <div className="modern-card-elevated p-6">
                <p className="text-sm font-medium text-primary-600">Total Value</p>
                <p className="text-2xl font-bold text-primary-900 mt-2">
                  ${reportData.summary.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="modern-card-elevated p-6 bg-red-50">
                <p className="text-sm font-medium text-primary-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {reportData.lowStock.count}
                </p>
              </div>
            </div>

            {reportData.lowStock.count > 0 && (
              <div className="modern-card-elevated">
                <div className="p-6 border-b border-primary-200 bg-red-50">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-primary-900">Low Stock Alerts</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-primary-200">
                          <th className="text-left py-3 px-4 font-semibold text-primary-900">
                            Item Name
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-primary-900">
                            SKU
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-primary-900">
                            Quantity
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-primary-900">
                            Category
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.lowStock.items.map((item) => (
                          <tr key={item.id} className="border-b border-primary-100">
                            <td className="py-3 px-4">{item.name}</td>
                            <td className="py-3 px-4">{item.sku}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                                {item.quantity}
                              </span>
                            </td>
                            <td className="py-3 px-4">{item.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="modern-card-elevated p-6">
              <h3 className="font-semibold text-primary-900 mb-4">Inventory by Category</h3>
              <div className="space-y-3">
                {Object.entries(reportData.byCategory).map(([category, stats]) => (
                  <div key={category} className="flex justify-between p-4 bg-primary-50 rounded">
                    <div>
                      <span className="font-medium text-primary-900">{category}</span>
                      <p className="text-sm text-primary-600 mt-1">
                        {stats.items} items • {stats.quantity} units
                      </p>
                    </div>
                    <span className="font-bold text-primary-900">
                      ${stats.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default InventoryReport;
