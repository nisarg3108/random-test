import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  TrendingUp,
  Users,
  Package,
  BarChart3,
  Download,
  Plus,
  Clock,
} from 'lucide-react';
import Layout from '../../components/layout/Layout.jsx';
import { useReportsStore } from '../../store/reports.store.js';

const ReportsDashboard = () => {
  const navigate = useNavigate();
  const { savedReports, fetchSavedReports, loading } = useReportsStore();

  useEffect(() => {
    fetchSavedReports();
  }, [fetchSavedReports]);

  const reportCategories = [
    {
      title: 'Financial Reports',
      icon: TrendingUp,
      color: 'blue',
      reports: [
        {
          name: 'Profit & Loss Statement',
          path: '/reports/financial/profit-loss',
          description: 'View revenue and expenses',
        },
        {
          name: 'Balance Sheet',
          path: '/reports/financial/balance-sheet',
          description: 'Assets, liabilities, and equity',
        },
      ],
    },
    {
      title: 'HR Analytics',
      icon: Users,
      color: 'green',
      reports: [
        {
          name: 'HR Analytics',
          path: '/reports/hr/analytics',
          description: 'Employee, leave, and payroll data',
        },
      ],
    },
    {
      title: 'Inventory Reports',
      icon: Package,
      color: 'purple',
      reports: [
        {
          name: 'Inventory Report',
          path: '/reports/inventory',
          description: 'Stock levels and valuations',
        },
      ],
    },
    {
      title: 'Custom Reports',
      icon: BarChart3,
      color: 'orange',
      reports: [
        {
          name: 'Custom Report Builder',
          path: '/reports/custom',
          description: 'Create your own reports',
        },
      ],
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-primary-900">
            Reports & Analytics
          </h1>
          <p className="text-primary-600 mt-1">
            Generate insights and export data from your ERP system
          </p>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reportCategories.map((category) => (
            <div key={category.title} className="modern-card-elevated p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className={`p-3 rounded-lg bg-${category.color}-50`}
                >
                  <category.icon className={`w-6 h-6 text-${category.color}-600`} />
                </div>
                <h3 className="font-semibold text-primary-900">
                  {category.title}
                </h3>
              </div>
              <div className="space-y-2">
                {category.reports.map((report) => (
                  <button
                    key={report.name}
                    onClick={() => navigate(report.path)}
                    className="w-full text-left p-3 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-primary-900">
                      {report.name}
                    </p>
                    <p className="text-xs text-primary-600 mt-1">
                      {report.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Reports */}
        <div className="modern-card-elevated">
          <div className="p-6 border-b border-primary-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-primary-900">
                  Recent Reports
                </h2>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : savedReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No reports generated yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Start by generating a report from the categories above
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedReports.slice(0, 5).map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/reports/saved/${report.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="font-medium text-primary-900">
                          {report.name}
                        </p>
                        <p className="text-sm text-primary-600">
                          {report.type} •{' '}
                          {new Date(report.generatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-primary-600" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/reports/custom')}
            className="btn-modern btn-primary flex items-center justify-center space-x-2 p-4"
          >
            <Plus className="w-5 h-5" />
            <span>Create Custom Report</span>
          </button>
          <button
            onClick={() => navigate('/reports/financial/profit-loss')}
            className="btn-modern btn-secondary flex items-center justify-center space-x-2 p-4"
          >
            <TrendingUp className="w-5 h-5" />
            <span>P&L Report</span>
          </button>
          <button
            onClick={() => navigate('/reports/hr/analytics')}
            className="btn-modern btn-secondary flex items-center justify-center space-x-2 p-4"
          >
            <Users className="w-5 h-5" />
            <span>HR Analytics</span>
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsDashboard;