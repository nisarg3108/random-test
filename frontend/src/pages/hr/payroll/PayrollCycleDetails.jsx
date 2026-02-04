import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import payrollAPI from '../../../api/payrollAPI';
import {
  ArrowLeft,
  FileText,
  DollarSign,
  Users,
  Calendar,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export default function PayrollCycleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCycleDetails();
  }, [id]);

  const fetchCycleDetails = async () => {
    try {
      setLoading(true);
      const response = await payrollAPI.getPayrollCycle(id);
      setCycle(response.data);
    } catch (error) {
      console.error('Failed to fetch cycle details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayslips = async () => {
    if (!confirm('Generate payslips for all employees? This cannot be undone.')) return;
    
    try {
      setProcessing(true);
      await payrollAPI.generatePayslips(id);
      await fetchCycleDetails();
      alert('Payslips generated successfully!');
    } catch (error) {
      console.error('Failed to generate payslips:', error);
      alert('Failed to generate payslips: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateDisbursements = async () => {
    if (!confirm('Create disbursements for all approved payslips?')) return;
    
    try {
      setProcessing(true);
      await payrollAPI.createDisbursements(id);
      await fetchCycleDetails();
      alert('Disbursements created successfully!');
    } catch (error) {
      console.error('Failed to create disbursements:', error);
      alert('Failed to create disbursements: ' + error.message);
    } finally {
      setProcessing(false);
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
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft', icon: AlertCircle },
      PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Processing', icon: AlertCircle },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed', icon: CheckCircle },
      PAID: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid', icon: CheckCircle },
      GENERATED: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Generated', icon: FileText },
      APPROVED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Approved', icon: CheckCircle },
      PENDING: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Pending', icon: AlertCircle }
    };
    
    const config = statusConfig[status] || statusConfig.DRAFT;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="p-6">
        <div className="text-center">
          <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cycle Not Found</h2>
          <button
            onClick={() => navigate('/hr/payroll/cycles')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Cycles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/hr/payroll/cycles')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cycles
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{cycle.name}</h1>
              {getStatusBadge(cycle.status)}
            </div>
            <p className="text-gray-600">
              {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
            </p>
          </div>
          
          <div className="flex gap-3">
            {cycle.status === 'DRAFT' && (
              <button
                onClick={handleGeneratePayslips}
                disabled={processing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {processing ? 'Generating...' : 'Generate Payslips'}
              </button>
            )}
            
            {cycle.status === 'PROCESSING' && cycle.payslips?.some(p => p.status === 'APPROVED') && (
              <button
                onClick={handleCreateDisbursements}
                disabled={processing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                {processing ? 'Creating...' : 'Create Disbursements'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Gross Salary</p>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(cycle.totalGross)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Deductions</p>
            <DollarSign className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(cycle.totalDeductions)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Net Payroll</p>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(cycle.totalNet)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Employees</p>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {cycle.payslips?.length || 0}
          </p>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Payslips</h2>
        </div>
        
        {!cycle.payslips || cycle.payslips.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payslips generated</h3>
            <p className="text-gray-600 mb-4">Generate payslips to process payroll for this cycle</p>
            {cycle.status === 'DRAFT' && (
              <button
                onClick={handleGeneratePayslips}
                disabled={processing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Generate Payslips
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Basic Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cycle.payslips.map((payslip) => (
                  <tr key={payslip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payslip.employee?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payslip.employee?.employeeCode}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payslip.basicSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payslip.grossSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {formatCurrency(payslip.totalDeductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(payslip.netSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payslip.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => navigate(`/hr/payroll/payslips/${payslip.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Disbursements */}
      {cycle.disbursements && cycle.disbursements.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Disbursements</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cycle.disbursements.map((disbursement) => (
                  <tr key={disbursement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {disbursement.employee?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(disbursement.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {disbursement.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(disbursement.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {disbursement.paymentDate ? formatDate(disbursement.paymentDate) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
