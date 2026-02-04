import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import payrollAPI from '../../../api/payrollAPI';
import { 
  DollarSign, 
  Users, 
  Calendar, 
  TrendingUp, 
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

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
      const disbursements = disbursementsRes.data || [];
      
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage salary processing and disbursements</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/hr/payroll/attendance')}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Attendance
          </button>
          <button
            onClick={() => navigate('/hr/payroll/cycles')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Manage Cycles
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payroll</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.totalPayroll)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            <TrendingUp className="w-4 h-4 inline text-green-600" />
            <span className="ml-1">Current period</span>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Salary</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.avgSalary)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            <span>{stats.totalPayslips} employees</span>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.pendingApprovals}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            <span>Payslips awaiting approval</span>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disbursements</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.completedDisbursements}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            <span>Successfully completed</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payroll Cycles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Payroll Cycles</h2>
              <button
                onClick={() => navigate('/hr/payroll/cycles')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all
              </button>
            </div>
          </div>
          <div className="p-6">
            {recentCycles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No payroll cycles found</p>
                <button
                  onClick={() => navigate('/hr/payroll/cycles/new')}
                  className="mt-3 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Create your first cycle
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentCycles.map((cycle) => (
                  <div
                    key={cycle.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/hr/payroll/cycles/${cycle.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{cycle.name}</h3>
                      {getStatusBadge(cycle.status)}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Payment Date: {formatDate(cycle.paymentDate)}</p>
                      <p>Total: {formatCurrency(cycle.totalNet)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Payslips */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Payslips</h2>
              <button
                onClick={() => navigate('/hr/payroll/payslips')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all
              </button>
            </div>
          </div>
          <div className="p-6">
            {recentPayslips.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No payslips generated yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPayslips.map((payslip) => (
                  <div
                    key={payslip.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/hr/payroll/payslips/${payslip.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{payslip.employee?.name}</h3>
                        <p className="text-sm text-gray-500">{payslip.employee?.employeeCode}</p>
                      </div>
                      {getStatusBadge(payslip.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium text-gray-900">
                        Net: {formatCurrency(payslip.netSalary)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/hr/payroll/cycles/new')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-center"
          >
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">New Payroll Cycle</p>
          </button>
          
          <button
            onClick={() => navigate('/hr/payroll/components')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-center"
          >
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">Salary Components</p>
          </button>
          
          <button
            onClick={() => navigate('/hr/payroll/tax-config')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-center"
          >
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">Tax Configuration</p>
          </button>
          
          <button
            onClick={() => navigate('/hr/payroll/reports')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-center"
          >
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">Reports</p>
          </button>
        </div>
      </div>
    </div>
  );
}
