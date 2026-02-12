import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import payrollAPI from '../../../api/payrollAPI';
import { 
  DollarSign, 
  Users, 
  Calendar, 
  TrendingUp, 
  FileText, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import Layout from '../../../components/layout/Layout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export default function PayrollDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    currentCycle: null,
    totalPayslips: 0,
    pendingApprovals: 0,
    completedDisbursements: 0,
    totalPayroll: 0,
    avgSalary: 0
  });
  const [recentPayslips, setRecentPayslips] = useState([]);
  const [recentCycles, setRecentCycles] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch payroll cycles
      const cyclesRes = await payrollAPI.getPayrollCycles();
      const cycles = cyclesRes.data || [];
      setRecentCycles(cycles.slice(0, 5));
      
      const currentCycle = cycles.find(c => c.status === 'PROCESSING') || cycles[0];
      
      // Fetch payslips
      const payslipsRes = await payrollAPI.getPayslips({ limit: 10 });
      const payslips = payslipsRes.data || [];
      setRecentPayslips(payslips.slice(0, 5));
      
      // Fetch disbursements
      const disbursementsRes = await payrollAPI.getDisbursements();
      const disbursements = disbursementsRes.disbursements || [];
      
      // Calculate stats
      const totalPayroll = payslips.reduce((sum, p) => sum + (p.netSalary || 0), 0);
      const avgSalary = payslips.length > 0 ? totalPayroll / payslips.length : 0;
      const pendingApprovals = payslips.filter(p => p.status === 'GENERATED').length;
      const completedDisbursements = disbursements.filter(d => d.status === 'COMPLETED').length;
      
      setStats({
        currentCycle,
        totalPayslips: payslips.length,
        pendingApprovals,
        completedDisbursements,
        totalPayroll,
        avgSalary
      });
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
      PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Processing' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      PAID: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
      GENERATED: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Generated' },
      APPROVED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Approved' },
      PENDING: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Pending' }
    };
    
    const config = statusConfig[status] || statusConfig.DRAFT;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
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

  return (
    <Layout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Payroll Dashboard</h1>
          <p className="text-primary-600 mt-1">Manage salary processing and disbursements</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/hr/payroll/cycles')}
            className="btn-modern btn-primary flex items-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Manage Cycles</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="modern-card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <TrendingUp className="w-3 h-3" />
              <span>+12%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Payroll</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPayroll)}</p>
            <p className="text-xs text-gray-500 mt-2">Current period</p>
          </div>
        </div>

        <div className="modern-card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-500">{stats.totalPayslips} employees</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Avg. Salary</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.avgSalary)}</p>
            <p className="text-xs text-gray-500 mt-2">Per employee</p>
          </div>
        </div>

        <div className="modern-card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            {stats.pendingApprovals > 0 && (
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Pending Approvals</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
            <p className="text-xs text-gray-500 mt-2">Awaiting approval</p>
          </div>
        </div>

        <div 
          className="modern-card-elevated p-6 cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105"
          onClick={() => navigate('/hr/payroll/disbursements')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <CheckCircle className="w-3 h-3" />
              <span>Done</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Disbursements</p>
            <p className="text-2xl font-bold text-gray-900">{stats.completedDisbursements}</p>
            <p className="text-xs text-gray-500 mt-2">Successfully completed</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Payroll Cycles */}
        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Payroll Cycles</h2>
              </div>
              <button
                onClick={() => navigate('/hr/payroll/cycles')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
              >
                <span>View all</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-6">
            {recentCycles.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-3">No payroll cycles found</p>
                <button
                  onClick={() => navigate('/hr/payroll/cycles/new')}
                  className="btn-modern btn-primary text-sm"
                >
                  Create your first cycle
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCycles.map((cycle) => (
                  <div
                    key={cycle.id}
                    className="p-4 border border-gray-200 rounded-xl hover:shadow-md hover:border-blue-300 cursor-pointer transition-all duration-200"
                    onClick={() => navigate(`/hr/payroll/cycles/${cycle.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{cycle.name}</h3>
                      {getStatusBadge(cycle.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Payment Date</p>
                        <p className="text-gray-900 font-medium">{formatDate(cycle.paymentDate)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Total Amount</p>
                        <p className="text-gray-900 font-medium">{formatCurrency(cycle.totalNet)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Payslips */}
        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Payslips</h2>
              </div>
              <button
                onClick={() => navigate('/hr/payroll/payslips')}
                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center space-x-1"
              >
                <span>View all</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-6">
            {recentPayslips.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600">No payslips generated yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPayslips.map((payslip) => (
                  <div
                    key={payslip.id}
                    className="p-4 border border-gray-200 rounded-xl hover:shadow-md hover:border-green-300 cursor-pointer transition-all duration-200"
                    onClick={() => navigate(`/hr/payroll/payslips/${payslip.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {payslip.employee?.name?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{payslip.employee?.name}</h3>
                          <p className="text-xs text-gray-500">{payslip.employee?.employeeCode}</p>
                        </div>
                      </div>
                      {getStatusBadge(payslip.status)}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500">Net Salary</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(payslip.netSalary)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-modern">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/hr/payroll/cycles/new')}
            className="p-4 border-2 border-dashed border-primary-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-center transition-colors"
          >
            <Calendar className="w-8 h-8 mx-auto mb-2 text-primary-400" />
            <p className="text-sm font-medium text-primary-700">New Payroll Cycle</p>
          </button>
          
          <button
            onClick={() => navigate('/hr/payroll/disbursements')}
            className="p-4 border-2 border-dashed border-primary-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 text-center transition-colors"
          >
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary-400" />
            <p className="text-sm font-medium text-primary-700">Salary Disbursements</p>
          </button>
          
          <button
            onClick={() => navigate('/hr/payroll/tax-config')}
            className="p-4 border-2 border-dashed border-primary-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-center transition-colors"
          >
            <FileText className="w-8 h-8 mx-auto mb-2 text-primary-400" />
            <p className="text-sm font-medium text-primary-700">Tax Configuration</p>
          </button>
          
          <button
            onClick={() => navigate('/hr/payroll/reports')}
            className="p-4 border-2 border-dashed border-primary-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-center transition-colors"
          >
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary-400" />
            <p className="text-sm font-medium text-primary-700">Reports</p>
          </button>
        </div>
      </div>
      </div>
    </Layout>
  );
}
