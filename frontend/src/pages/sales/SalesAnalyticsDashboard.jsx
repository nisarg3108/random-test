import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, FileText, CreditCard, Users, Package, Activity, Download, Mail, Calendar, Send, X, Check } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { salesAPI } from '../../api/sales.api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
  { value: 'custom', label: 'Custom Range' }
];

const SalesAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [revenueMetrics, setRevenueMetrics] = useState(null);
  const [paymentAnalytics, setPaymentAnalytics] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState({ start: null, end: null });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [emailForm, setEmailForm] = useState({ recipients: '', format: 'pdf' });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod, customDateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (selectedPeriod === 'custom' && customDateRange.start && customDateRange.end) {
        params.startDate = customDateRange.start.toISOString();
        params.endDate = customDateRange.end.toISOString();
      }

      const [analyticsRes, revenueRes, paymentsRes] = await Promise.all([
        salesAPI.getSalesAnalytics(params),
        salesAPI.getRevenueMetrics({ period: selectedPeriod === 'custom' ? '30d' : selectedPeriod }),
        salesAPI.getPaymentAnalytics(params)
      ]);

      setAnalytics(analyticsRes.data);
      setRevenueMetrics(revenueRes.data);
      setPaymentAnalytics(paymentsRes.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadForecast = async () => {
    try {
      setError(null);
      const res = await salesAPI.getRevenueForecast({ method: 'linear', periodsAhead: 30 });
      setForecast(res.data);
      setShowForecast(true);
      setSuccessMessage('Forecast loaded successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error loading forecast:', err);
      setError(`Failed to load forecast: ${err.response?.data?.message || err.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleExport = async (format) => {
    try {
      setError(null);
      const params = {};
      if (selectedPeriod === 'custom' && customDateRange.start && customDateRange.end) {
        params.startDate = customDateRange.start.toISOString();
        params.endDate = customDateRange.end.toISOString();
      }

      let response;
      let contentType;
      let fileExtension;
      
      if (format === 'pdf') {
        response = await salesAPI.exportPDF(params);
        contentType = 'application/pdf';
        fileExtension = 'pdf';
      } else if (format === 'csv') {
        response = await salesAPI.exportCSV(params);
        contentType = 'text/csv';
        fileExtension = 'csv';
      } else if (format === 'excel') {
        response = await salesAPI.exportExcel(params);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
      }

      // Create download link from blob
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-analytics-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessMessage(`Analytics exported successfully as ${format.toUpperCase()}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Export error:', err);
      setError(`Failed to export analytics: ${err.response?.data?.message || err.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleEmailReport = async () => {
    try {
      setError(null);
      const recipients = emailForm.recipients.split(',').map(email => email.trim()).filter(email => email);
      
      if (recipients.length === 0) {
        setError('Please enter at least one email address');
        setTimeout(() => setError(null), 3000);
        return;
      }

      const params = {};
      if (selectedPeriod === 'custom' && customDateRange.start && customDateRange.end) {
        params.startDate = customDateRange.start.toISOString();
        params.endDate = customDateRange.end.toISOString();
      }

      await salesAPI.emailReport(
        { recipients, format: emailForm.format, subject: 'Sales Analytics Report' },
        params
      );

      setShowEmailModal(false);
      setEmailForm({ recipients: '', format: 'pdf' });
      setSuccessMessage(`Report sent to ${recipients.length} recipient(s)`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Email error:', err);
      setError(`Failed to send email: ${err.response?.data?.message || err.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handlePeriodChange = (value) => {
    setSelectedPeriod(value);
    if (value === 'custom') {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(false);
      setCustomDateRange({ start: null, end: null });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </Layout>
    );
  }

  // Prepare chart data
  const statusData = analytics?.invoiceStats ? [
    { name: 'Draft', value: analytics.invoiceStats.draft },
    { name: 'Sent', value: analytics.invoiceStats.sent },
    { name: 'Partially Paid', value: analytics.invoiceStats.partiallyPaid },
    { name: 'Paid', value: analytics.invoiceStats.paid },
    { name: 'Overdue', value: analytics.invoiceStats.overdue }
  ].filter(item => item.value > 0) : [];

  const paymentMethodData = paymentAnalytics?.methodBreakdown ? 
    Object.entries(paymentAnalytics.methodBreakdown).map(([method, data]) => ({
      name: method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      amount: data.amount,
      count: data.count
    })) : [];

  const revenueData = analytics?.revenueTimeSeries || [];
  const paymentsData = analytics?.paymentsTimeSeries || [];

  const formatCurrency = (value) => `₹${Number(value).toFixed(2)}`;
  const formatNumber = (value) => Number(value).toLocaleString();

  const growthRate = parseFloat(revenueMetrics?.growthRate || 0);
  const isPositiveGrowth = growthRate >= 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-primary-900">Sales Analytics</h1>
              <p className="text-primary-600 mt-1">Comprehensive sales performance insights</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Export as PDF"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Export as CSV"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Export as Excel"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={() => setShowEmailModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title="Email Report"
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                onClick={loadForecast}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                title="Show Forecast"
              >
                <TrendingUp className="w-4 h-4" />
                Forecast
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-primary-700">Period:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PERIOD_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {showDatePicker && (
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                <DatePicker
                  selected={customDateRange.start}
                  onChange={(date) => setCustomDateRange({...customDateRange, start: date})}
                  selectsStart
                  startDate={customDateRange.start}
                  endDate={customDateRange.end}
                  placeholderText="Start Date"
                  className="px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dateFormat="MMM d, yyyy"
                />
                <span className="text-primary-600">to</span>
                <DatePicker
                  selected={customDateRange.end}
                  onChange={(date) => setCustomDateRange({...customDateRange, end: date})}
                  selectsEnd
                  startDate={customDateRange.start}
                  endDate={customDateRange.end}
                  minDate={customDateRange.start}
                  placeholderText="End Date"
                  className="px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dateFormat="MMM d, yyyy"
                />
              </div>
            )}
          </div>
        </div>

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Email Analytics Report</h3>
                <button onClick={() => setShowEmailModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipients (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={emailForm.recipients}
                    onChange={(e) => setEmailForm({...emailForm, recipients: e.target.value})}
                    placeholder="email1@example.com, email2@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                  <select
                    value={emailForm.format}
                    onChange={(e) => setEmailForm({...emailForm, format: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pdf">PDF</option>
                    <option value="csv">CSV</option>
                    <option value="excel">Excel</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEmailReport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                    Send Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Total Revenue</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">
                  {formatCurrency(analytics?.summary?.totalRevenue || 0)}
                </p>
                <div className="flex items-center mt-2">
                  {isPositiveGrowth ? (
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${isPositiveGrowth ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(growthRate).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Paid Revenue</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">
                  {formatCurrency(analytics?.summary?.paidRevenue || 0)}
                </p>
                <p className="text-xs text-primary-500 mt-2">
                  {analytics?.invoiceStats?.paid || 0} invoices paid
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Pending Revenue</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">
                  {formatCurrency(analytics?.summary?.pendingRevenue || 0)}
                </p>
                <p className="text-xs text-primary-500 mt-2">
                  Awaiting payment
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Total Payments</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">
                  {formatCurrency(paymentAnalytics?.totalAmount || 0)}
                </p>
                <p className="text-xs text-primary-500 mt-2">
                  {paymentAnalytics?.totalPayments || 0} transactions
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Metrics */}
        <div className="modern-card-elevated p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Conversion Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-primary-600">Quotations</p>
              <p className="text-3xl font-bold text-primary-900 mt-1">
                {analytics?.summary?.totalQuotations || 0}
              </p>
              <p className="text-sm text-primary-500 mt-2">
                {analytics?.conversionMetrics?.acceptedQuotations || 0} accepted
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-primary-600">Orders</p>
              <p className="text-3xl font-bold text-primary-900 mt-1">
                {analytics?.summary?.totalOrders || 0}
              </p>
              <p className="text-sm text-primary-500 mt-2">
                {analytics?.conversionMetrics?.confirmedOrders || 0} confirmed
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-primary-600">Invoices</p>
              <p className="text-3xl font-bold text-primary-900 mt-1">
                {analytics?.summary?.totalInvoices || 0}
              </p>
              <p className="text-sm text-primary-500 mt-2">
                {analytics?.invoiceStats?.paid || 0} fully paid
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="text-center p-4 border border-primary-200 rounded-lg">
              <p className="text-sm font-medium text-primary-600">Quotation Conversion Rate</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {analytics?.conversionMetrics?.quotationConversionRate || 0}%
              </p>
            </div>
            <div className="text-center p-4 border border-primary-200 rounded-lg">
              <p className="text-sm font-medium text-primary-600">Order Conversion Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {analytics?.conversionMetrics?.orderConversionRate || 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Charts Row 1: Revenue & Payment Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="modern-card-elevated p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">Revenue Trend</h2>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No revenue data available
              </div>
            )}
          </div>

          <div className="modern-card-elevated p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">Payments Trend</h2>
            {paymentsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="amount" fill="#10B981" name="Payment Amount" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No payment data available
              </div>
            )}
          </div>
        </div>

        {/* Charts Row 2: Invoice Status & Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="modern-card-elevated p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">Invoice Status Distribution</h2>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No invoice data available
              </div>
            )}
          </div>

          <div className="modern-card-elevated p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">Payment Methods</h2>
            {paymentMethodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentMethodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="amount" fill="#8B5CF6" name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No payment method data available
              </div>
            )}
          </div>
        </div>

        {/* Top Customers & Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="modern-card-elevated">
            <div className="px-6 py-4 border-b border-primary-200">
              <h2 className="text-lg font-semibold text-primary-900">Top Customers</h2>
            </div>
            <div className="p-6">
              {analytics?.topCustomers && analytics.topCustomers.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topCustomers.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-primary-900">{customer.name}</p>
                          <p className="text-sm text-primary-600">{formatCurrency(customer.revenue)}</p>
                        </div>
                      </div>
                      <Users className="w-5 h-5 text-primary-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No customer data available
                </div>
              )}
            </div>
          </div>

          <div className="modern-card-elevated">
            <div className="px-6 py-4 border-b border-primary-200">
              <h2 className="text-lg font-semibold text-primary-900">Top Products/Services</h2>
            </div>
            <div className="p-6">
              {analytics?.topProducts && analytics.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-primary-900">{product.description}</p>
                          <p className="text-sm text-primary-600">
                            {formatCurrency(product.revenue)} • Qty: {product.quantity}
                          </p>
                        </div>
                      </div>
                      <Package className="w-5 h-5 text-primary-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No product data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Forecast Section */}
        {showForecast && forecast && (
          <div className="modern-card-elevated p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-primary-900">Revenue Forecast (30 Days)</h2>
                <p className="text-sm text-primary-600 mt-1">
                  Trend: <span className="font-medium capitalize">{forecast.trend}</span> • 
                  Accuracy: <span className="font-medium">{forecast.accuracy?.interpretation || 'N/A'}</span>
                  {forecast.seasonality?.detected && ` • Seasonality: ${forecast.seasonality.strength}`}
                </p>
              </div>
              <button
                onClick={() => setShowForecast(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={[...forecast.historical, ...forecast.forecast]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  fill="#93C5FD" 
                  name="Historical Revenue" 
                  connectNulls
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#F59E0B" 
                  fill="#FCD34D" 
                  name="Forecasted Revenue" 
                  strokeDasharray="5 5"
                  connectNulls
                />
                <Area 
                  type="monotone" 
                  dataKey="lowerBound" 
                  stroke="#E5E7EB" 
                  fill="transparent" 
                  name="Confidence Interval (Lower)" 
                  strokeDasharray="2 2"
                  connectNulls
                />
                <Area 
                  type="monotone" 
                  dataKey="upperBound" 
                  stroke="#E5E7EB" 
                  fill="transparent" 
                  name="Confidence Interval (Upper)" 
                  strokeDasharray="2 2"
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="modern-card-elevated p-4">
            <p className="text-sm font-medium text-primary-600">Average Invoice Value</p>
            <p className="text-2xl font-bold text-primary-900 mt-1">
              {formatCurrency(revenueMetrics?.averageInvoiceValue || 0)}
            </p>
          </div>
          <div className="modern-card-elevated p-4">
            <p className="text-sm font-medium text-primary-600">Average Payment</p>
            <p className="text-2xl font-bold text-primary-900 mt-1">
              {formatCurrency(paymentAnalytics?.averagePayment || 0)}
            </p>
          </div>
          <div className="modern-card-elevated p-4">
            <p className="text-sm font-medium text-primary-600">Average Payment Time</p>
            <p className="text-2xl font-bold text-primary-900 mt-1">
              {paymentAnalytics?.averagePaymentTime || 0} days
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SalesAnalyticsDashboard;
