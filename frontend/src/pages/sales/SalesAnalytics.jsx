import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, DollarSign, FileText } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { salesAPI } from '../../api/sales.api';

const SalesAnalytics = () => {
  const [data, setData] = useState({
    quotations: [],
    orders: [],
    invoices: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [quotations, orders, invoices] = await Promise.all([
        salesAPI.getQuotations(),
        salesAPI.getSalesOrders(),
        salesAPI.getInvoices()
      ]);
      setData({
        quotations: quotations.data || [],
        orders: orders.data || [],
        invoices: invoices.data || []
      });
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const stats = {
    totalQuotations: data.quotations.length,
    quotationValue: data.quotations.reduce((sum, q) => sum + (q.total || 0), 0),
    acceptedQuotations: data.quotations.filter(q => q.status === 'ACCEPTED').length,
    totalOrders: data.orders.length,
    orderValue: data.orders.reduce((sum, o) => sum + (o.total || 0), 0),
    deliveredOrders: data.orders.filter(o => o.status === 'DELIVERED').length,
    totalInvoices: data.invoices.length,
    invoiceValue: data.invoices.reduce((sum, i) => sum + (i.total || 0), 0),
    paidAmount: data.invoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0),
    pendingAmount: data.invoices.reduce((sum, i) => sum + ((i.total || 0) - (i.amountPaid || 0)), 0)
  };

  // Status distribution data
  const quotationStatus = {
    DRAFT: data.quotations.filter(q => q.status === 'DRAFT').length,
    SENT: data.quotations.filter(q => q.status === 'SENT').length,
    ACCEPTED: data.quotations.filter(q => q.status === 'ACCEPTED').length,
    REJECTED: data.quotations.filter(q => q.status === 'REJECTED').length,
    EXPIRED: data.quotations.filter(q => q.status === 'EXPIRED').length
  };

  const orderStatus = {
    PENDING: data.orders.filter(o => o.status === 'PENDING').length,
    CONFIRMED: data.orders.filter(o => o.status === 'CONFIRMED').length,
    SHIPPED: data.orders.filter(o => o.status === 'SHIPPED').length,
    DELIVERED: data.orders.filter(o => o.status === 'DELIVERED').length,
    CANCELLED: data.orders.filter(o => o.status === 'CANCELLED').length
  };

  const invoiceStatus = {
    DRAFT: data.invoices.filter(i => i.status === 'DRAFT').length,
    SENT: data.invoices.filter(i => i.status === 'SENT').length,
    PAID: data.invoices.filter(i => i.status === 'PAID').length,
    PARTIALLY_PAID: data.invoices.filter(i => i.status === 'PARTIALLY_PAID').length,
    OVERDUE: data.invoices.filter(i => i.status === 'OVERDUE').length
  };

  const quotationStatusData = Object.entries(quotationStatus).map(([name, value]) => ({ name, value }));
  const orderStatusData = Object.entries(orderStatus).map(([name, value]) => ({ name, value }));
  const invoiceStatusData = Object.entries(invoiceStatus).map(([name, value]) => ({ name, value }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Monthly revenue trend
  const monthlyRevenue = {};
  data.orders.forEach(order => {
    const month = new Date(order.orderDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (order.total || 0);
  });
  const revenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }));

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Sales Analytics</h1>
          <p className="text-primary-600 mt-1">Overview of quotations, orders, and invoices</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        {loading ? (
          <div className="p-8"><LoadingSpinner /></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="modern-card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-600">Total Orders</p>
                    <p className="text-2xl font-bold text-primary-900 mt-1">{stats.totalOrders}</p>
                    <p className="text-xs text-primary-500 mt-2">₹{stats.orderValue.toFixed(2)}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </div>

              <div className="modern-card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-600">Total Quotations</p>
                    <p className="text-2xl font-bold text-primary-900 mt-1">{stats.totalQuotations}</p>
                    <p className="text-xs text-primary-500 mt-2">₹{stats.quotationValue.toFixed(2)}</p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-500 opacity-50" />
                </div>
              </div>

              <div className="modern-card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-600">Total Invoices</p>
                    <p className="text-2xl font-bold text-primary-900 mt-1">{stats.totalInvoices}</p>
                    <p className="text-xs text-emerald-600 font-medium mt-2">₹{stats.paidAmount.toFixed(2)} Paid</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-emerald-500 opacity-50" />
                </div>
              </div>

              <div className="modern-card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-600">Pending Payment</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">₹{stats.pendingAmount.toFixed(2)}</p>
                    <p className="text-xs text-primary-500 mt-2">{stats.totalInvoices} invoices</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-red-500 opacity-50" />
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Revenue */}
              <div className="modern-card-elevated p-6">
                <h2 className="text-lg font-semibold text-primary-900 mb-4">Monthly Revenue</h2>
                {revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">No data available</div>
                )}
              </div>

              {/* Order Status Distribution */}
              <div className="modern-card-elevated p-6">
                <h2 className="text-lg font-semibold text-primary-900 mb-4">Order Status Distribution</h2>
                {orderStatusData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={orderStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                        {orderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">No data available</div>
                )}
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quotation Status Distribution */}
              <div className="modern-card-elevated p-6">
                <h2 className="text-lg font-semibold text-primary-900 mb-4">Quotation Status Distribution</h2>
                {quotationStatusData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={quotationStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8B5CF6" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">No data available</div>
                )}
              </div>

              {/* Invoice Status Distribution */}
              <div className="modern-card-elevated p-6">
                <h2 className="text-lg font-semibold text-primary-900 mb-4">Invoice Status Distribution</h2>
                {invoiceStatusData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={invoiceStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10B981" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">No data available</div>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="modern-card-elevated p-6">
                <h3 className="text-lg font-semibold text-primary-900 mb-4">Conversion Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-primary-700">Quotation to Order Rate</span>
                    <span className="text-lg font-bold text-blue-600">
                      {stats.totalQuotations > 0 ? Math.round((stats.acceptedQuotations / stats.totalQuotations) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-primary-700">Order Fulfillment Rate</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {stats.totalOrders > 0 ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-primary-700">Invoice Payment Rate</span>
                    <span className="text-lg font-bold text-purple-600">
                      {stats.totalInvoices > 0 ? Math.round((stats.paidAmount / stats.invoiceValue) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="modern-card-elevated p-6">
                <h3 className="text-lg font-semibold text-primary-900 mb-4">Key Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-primary-700">Average Order Value</span>
                    <span className="text-lg font-bold text-blue-600">
                      ₹{stats.totalOrders > 0 ? (stats.orderValue / stats.totalOrders).toFixed(2) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-primary-700">Average Quote Value</span>
                    <span className="text-lg font-bold text-purple-600">
                      ₹{stats.totalQuotations > 0 ? (stats.quotationValue / stats.totalQuotations).toFixed(2) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-primary-700">Average Invoice Value</span>
                    <span className="text-lg font-bold text-emerald-600">
                      ₹{stats.totalInvoices > 0 ? (stats.invoiceValue / stats.totalInvoices).toFixed(2) : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default SalesAnalytics;
