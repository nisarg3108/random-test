import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, FileText, Users, Package, Clock, BarChart3 } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PurchaseAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [vendorPerformance, setVendorPerformance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalytics();
    fetchVendorPerformance();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(dateRange).toString();
      const response = await axios.get(`${API_URL}/api/purchase/analytics?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorPerformance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/purchase/vendor-performance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendorPerformance(response.data);
    } catch (err) {
      console.error('Failed to fetch vendor performance:', err);
    }
  };

  if (loading || !analytics) {
    return (
      <Layout>
        <div className="p-8"><LoadingSpinner /></div>
      </Layout>
    );
  }

  const { summary, poByStatus, topVendors, paymentStatus, monthlyTrend } = analytics;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Purchase Analytics</h1>
            <p className="text-primary-600 mt-1">Insights and performance metrics</p>
          </div>
          <div className="flex space-x-3">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="input-modern"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="input-modern"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Total POs</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{summary.totalPOs}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Total Spend</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">${summary.totalSpend?.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Avg PO Value</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">${summary.avgPOValue?.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Pending Requisitions</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{summary.pendingRequisitions}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-50">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{summary.pendingApprovals}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-50">
                <Package className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PO by Status */}
          <div className="modern-card-elevated p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Purchase Orders by Status
            </h3>
            <div className="space-y-3">
              {poByStatus.map((item) => (
                <div key={item.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-primary-600">{item.status}</span>
                    <span className="font-medium">{item._count}</span>
                  </div>
                  <div className="w-full bg-primary-100 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${(item._count / summary.totalPOs) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Status */}
          <div className="modern-card-elevated p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Payment Status
            </h3>
            <div className="space-y-3">
              {paymentStatus.map((item) => (
                <div key={item.paymentStatus}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-primary-600">{item.paymentStatus}</span>
                    <div className="text-right">
                      <span className="font-medium">{item._count} POs</span>
                      <span className="text-xs text-primary-500 ml-2">${item._sum?.totalAmount?.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full bg-primary-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.paymentStatus === 'PAID' ? 'bg-emerald-500' :
                        item.paymentStatus === 'PARTIAL' ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(item._sum?.totalAmount / summary.totalSpend) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Vendors */}
        <div className="modern-card-elevated p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Top Vendors by Spend
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-primary-500 uppercase">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-primary-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-primary-500 uppercase">Orders</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-primary-500 uppercase">Total Spend</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-primary-500 uppercase">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-200">
                {topVendors.map((item) => (
                  <tr key={item.vendorId} className="hover:bg-primary-50">
                    <td className="px-4 py-3 text-sm font-medium">{item.vendor?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-primary-600">{item.vendor?.vendorCode || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-right">{item._count}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">${item._sum?.totalAmount?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right">{((item._sum?.totalAmount / summary.totalSpend) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Trend */}
        {monthlyTrend && monthlyTrend.length > 0 && (
          <div className="modern-card-elevated p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Monthly Purchase Trend
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-primary-500 uppercase">Month</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-primary-500 uppercase">Orders</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-primary-500 uppercase">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-200">
                  {monthlyTrend.map((item, index) => (
                    <tr key={index} className="hover:bg-primary-50">
                      <td className="px-4 py-3 text-sm">{new Date(item.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</td>
                      <td className="px-4 py-3 text-sm text-right">{item.count}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">${item.total?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vendor Performance */}
        {vendorPerformance.length > 0 && (
          <div className="modern-card-elevated p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Vendor Performance Summary
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-primary-500 uppercase">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-primary-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-primary-500 uppercase">Quality</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-primary-500 uppercase">Delivery</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-primary-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-primary-500 uppercase">Overall</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-primary-500 uppercase">Evaluations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-200">
                  {vendorPerformance.map((item) => (
                    <tr key={item.vendorId} className="hover:bg-primary-50">
                      <td className="px-4 py-3 text-sm font-medium">{item.vendor?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-primary-600">{item.vendor?.category || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-right">{item._avg?.qualityRating?.toFixed(1) || '0.0'}</td>
                      <td className="px-4 py-3 text-sm text-right">{item._avg?.deliveryRating?.toFixed(1) || '0.0'}</td>
                      <td className="px-4 py-3 text-sm text-right">{item._avg?.priceRating?.toFixed(1) || '0.0'}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{item._avg?.overallRating?.toFixed(1) || '0.0'}</td>
                      <td className="px-4 py-3 text-sm text-right">{item._count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PurchaseAnalytics;
