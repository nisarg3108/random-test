import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import payrollAPI from '../../../api/payrollAPI';
import { 
  ArrowLeft, Download, CheckCircle, Printer, 
  TrendingUp, TrendingDown, DollarSign, Calendar,
  PieChart, BarChart3, FileText, User
} from 'lucide-react';
import Layout from '../../../components/layout/Layout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export default function PayslipDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayslip();
  }, [id]);

  const fetchPayslip = async () => {
    try {
      const response = await payrollAPI.getPayslip(id);
      setPayslip(response.data);
    } catch (error) {
      console.error('Failed to fetch payslip:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Approve this payslip?')) return;
    try {
      await payrollAPI.approvePayslip(id);
      await fetchPayslip();
      alert('Payslip approved successfully!');
    } catch (error) {
      alert('Failed to approve payslip');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (!payslip) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-primary-600">Payslip not found</p>
        </div>
      </Layout>
    );
  }

  const allowances = payslip.allowances || {};
  const otherDeductions = payslip.otherDeductions || {};

  // Calculate percentages for visualization
  const earningsBreakdown = [
    { label: 'Basic Salary', amount: payslip.basicSalary, color: 'bg-blue-500' },
    ...Object.entries(allowances).map(([key, value]) => ({
      label: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      amount: value,
      color: 'bg-green-500'
    })),
    ...(payslip.bonuses > 0 ? [{ label: 'Bonuses', amount: payslip.bonuses, color: 'bg-purple-500' }] : []),
    ...(payslip.overtime > 0 ? [{ label: 'Overtime', amount: payslip.overtime, color: 'bg-orange-500' }] : [])
  ];

  const deductionsBreakdown = [
    { label: 'Income Tax', amount: payslip.taxDeductions, color: 'bg-red-500' },
    { label: 'Provident Fund', amount: payslip.providentFund, color: 'bg-orange-500' },
    { label: 'Insurance', amount: payslip.insurance, color: 'bg-amber-500' },
    ...Object.entries(otherDeductions).map(([key, value]) => ({
      label: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      amount: value,
      color: 'bg-rose-500'
    }))
  ].filter(item => item.amount > 0);

  const getStatusBadge = (status) => {
    const configs = {
      GENERATED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Generated' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
      PAID: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' }
    };
    const config = configs[status] || configs.GENERATED;
    return (
      <span className={`px-4 py-1 text-sm font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payslips</span>
        </button>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-modern bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Gross Salary</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {formatCurrency(payslip.grossSalary)}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-400" />
            </div>
          </div>

          <div className="card-modern bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Deductions</p>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {formatCurrency(payslip.totalDeductions)}
                </p>
              </div>
              <TrendingDown className="w-10 h-10 text-red-400" />
            </div>
          </div>

          <div className="card-modern bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Net Salary</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {formatCurrency(payslip.netSalary)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-400" />
            </div>
          </div>

          <div className="card-modern bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Attendance</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {payslip.presentDays}/{payslip.workingDays}
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  {((payslip.presentDays / payslip.workingDays) * 100).toFixed(1)}% present
                </p>
              </div>
              <Calendar className="w-10 h-10 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card-modern p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b border-primary-200">
            <div>
              <h1 className="text-3xl font-bold text-primary-900 mb-2">PAYSLIP</h1>
              <p className="text-primary-600">
                For the period: {formatDate(payslip.payrollCycle?.startDate)} to {formatDate(payslip.payrollCycle?.endDate)}
              </p>
              <p className="text-sm text-primary-500 mt-1">Payslip #: {payslip.payslipNumber}</p>
            </div>
            <div className="text-right">
              {getStatusBadge(payslip.status)}
              <p className="text-sm text-primary-600 mt-2">
                Generated: {formatDate(payslip.createdAt)}
              </p>
            </div>
          </div>

          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-primary-600 uppercase mb-3">Employee Details</h3>
              <div className="space-y-2">
                <p><span className="text-primary-600">Name:</span> <span className="font-medium text-primary-900">{payslip.employee?.name}</span></p>
                <p><span className="text-primary-600">Employee ID:</span> <span className="font-medium text-primary-900">{payslip.employee?.employeeCode}</span></p>
                <p><span className="text-primary-600">Designation:</span> <span className="font-medium text-primary-900">{payslip.employee?.designation}</span></p>
                <p><span className="text-primary-600">Department:</span> <span className="font-medium text-primary-900">{payslip.employee?.department?.name}</span></p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-600 uppercase mb-3">Payment Info</h3>
              <div className="space-y-2">
                <p><span className="text-primary-600">Payment Date:</span> <span className="font-medium text-primary-900">{formatDate(payslip.payrollCycle?.paymentDate)}</span></p>
                <p><span className="text-primary-600">Working Days:</span> <span className="font-medium text-primary-900">{payslip.workingDays}</span></p>
                <p><span className="text-primary-600">Present Days:</span> <span className="font-medium text-primary-900">{payslip.presentDays}</span></p>
                <p><span className="text-primary-600">Leave Days:</span> <span className="font-medium text-primary-900">{payslip.leaveDays}</span></p>
              </div>
            </div>
          </div>

          {/* Visual Breakdown */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Salary Components Breakdown
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Earnings Visualization */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Earnings ({formatCurrency(payslip.grossSalary)})
                </h4>
                <div className="space-y-3">
                  {earningsBreakdown.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-primary-700">{item.label}</span>
                        <span className="font-semibold text-primary-900">
                          {formatCurrency(item.amount)}
                          <span className="text-xs text-primary-600 ml-2">
                            ({((item.amount / payslip.grossSalary) * 100).toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${item.color} transition-all duration-500`}
                          style={{ width: `${(item.amount / payslip.grossSalary) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions Visualization */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Deductions ({formatCurrency(payslip.totalDeductions)})
                </h4>
                <div className="space-y-3">
                  {deductionsBreakdown.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-primary-700">{item.label}</span>
                        <span className="font-semibold text-primary-900">
                          {formatCurrency(item.amount)}
                          <span className="text-xs text-primary-600 ml-2">
                            ({((item.amount / payslip.totalDeductions) * 100).toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${item.color} transition-all duration-500`}
                          style={{ width: `${(item.amount / payslip.totalDeductions) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-primary-700 uppercase mb-3 bg-green-50 p-3 rounded-lg flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Earnings
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-primary-100">
                  <span className="text-primary-700">Basic Salary</span>
                  <span className="font-medium text-primary-900">{formatCurrency(payslip.basicSalary)}</span>
                </div>
                {Object.entries(allowances).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-primary-100">
                    <span className="text-primary-700 capitalize">{key.replace('_', ' ')}</span>
                    <span className="font-medium text-primary-900">{formatCurrency(value)}</span>
                  </div>
                ))}
                {payslip.bonuses > 0 && (
                  <div className="flex justify-between py-2 border-b border-primary-100">
                    <span className="text-primary-700">Bonuses</span>
                    <span className="font-medium text-primary-900">{formatCurrency(payslip.bonuses)}</span>
                  </div>
                )}
                {payslip.overtime > 0 && (
                  <div className="flex justify-between py-2 border-b border-primary-100">
                    <span className="text-primary-700">Overtime</span>
                    <span className="font-medium text-primary-900">{formatCurrency(payslip.overtime)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 font-semibold text-green-700 bg-green-50 px-3 rounded-lg mt-2">
                  <span>Gross Salary</span>
                  <span>{formatCurrency(payslip.grossSalary)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-primary-700 uppercase mb-3 bg-red-50 p-3 rounded-lg flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Deductions
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-primary-100">
                  <span className="text-primary-700">Income Tax</span>
                  <span className="font-medium text-primary-900">{formatCurrency(payslip.taxDeductions)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-primary-100">
                  <span className="text-primary-700">Provident Fund</span>
                  <span className="font-medium text-primary-900">{formatCurrency(payslip.providentFund)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-primary-100">
                  <span className="text-primary-700">Insurance</span>
                  <span className="font-medium text-primary-900">{formatCurrency(payslip.insurance)}</span>
                </div>
                {Object.entries(otherDeductions).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-primary-100">
                    <span className="text-primary-700 capitalize">{key.replace('_', ' ')}</span>
                    <span className="font-medium text-primary-900">{formatCurrency(value)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-3 font-semibold text-red-700 bg-red-50 px-3 rounded-lg mt-2">
                  <span>Total Deductions</span>
                  <span>{formatCurrency(payslip.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-primary-900">Net Salary</span>
              <span className="text-3xl font-bold text-blue-600">{formatCurrency(payslip.netSalary)}</span>
            </div>
            <p className="text-sm text-primary-600 mt-2">Amount in words: {/* TODO: Convert to words */}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-6 border-t border-primary-200">
            <button 
              onClick={() => window.print()} 
              className="btn-modern btn-secondary flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button className="btn-modern btn-secondary flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            {payslip.status === 'GENERATED' && (
              <button 
                onClick={handleApprove} 
                className="btn-modern bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve Payslip</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
