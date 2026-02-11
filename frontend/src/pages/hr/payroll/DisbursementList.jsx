import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import payrollAPI from '../../../api/payrollAPI';
import { 
  DollarSign, Plus, Search, Filter, Download, Upload, 
  CheckCircle, Clock, AlertCircle, XCircle, TrendingUp,
  Calendar, CreditCard, ArrowUpRight, FileText
} from 'lucide-react';
import Layout from '../../../components/layout/Layout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import PaymentFileGenerator from './PaymentFileGenerator';
import ReconciliationUpload from './ReconciliationUpload';

export default function DisbursementList() {
  const navigate = useNavigate();
  const [disbursements, setDisbursements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  useEffect(() => {
    fetchDisbursements();
    fetchStats();
  }, [filters.status, filters.paymentMethod, filters.dateFrom, filters.dateTo]);

  const fetchDisbursements = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      
      const response = await payrollAPI.getDisbursements(params);
      setDisbursements(response.data?.disbursements || []);
    } catch (error) {
      console.error('Failed to fetch disbursements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {};
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      
      const response = await payrollAPI.getDisbursementStats(params);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedIds.length === 0) {
      alert('Please select disbursements to update');
      return;
    }

    try {
      const transactionRef = prompt('Enter transaction reference (optional):');
      await payrollAPI.bulkUpdateDisbursementStatus({
        disbursementIds: selectedIds,
        status,
        transactionRef: transactionRef || undefined,
        notes: `Bulk ${status.toLowerCase()} on ${new Date().toLocaleDateString()}`
      });
      
      setSelectedIds([]);
      fetchDisbursements();
      fetchStats();
      alert(`Successfully updated ${selectedIds.length} disbursements to ${status}`);
    } catch (error) {
      console.error('Failed to update disbursements:', error);
      alert('Failed to update disbursements');
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === disbursements.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(disbursements.map(d => d.id));
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

  const getStatusConfig = (status) => {
    const configs = {
      PENDING: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-700', 
        icon: Clock,
        label: 'Pending' 
      },
      PROCESSING: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-700', 
        icon: TrendingUp,
        label: 'Processing' 
      },
      COMPLETED: { 
        bg: 'bg-green-100', 
        text: 'text-green-700', 
        icon: CheckCircle,
        label: 'Completed' 
      },
      FAILED: { 
        bg: 'bg-red-100', 
        text: 'text-red-700', 
        icon: XCircle,
        label: 'Failed' 
      }
    };
    return configs[status] || configs.PENDING;
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      BANK_TRANSFER: CreditCard,
      CHEQUE: FileText,
      CASH: DollarSign,
      UPI: ArrowUpRight
    };
    return icons[method] || CreditCard;
  };

  const filteredDisbursements = disbursements.filter(d => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      d.employee?.name?.toLowerCase().includes(search) ||
      d.employee?.employeeCode?.toLowerCase().includes(search) ||
      d.transactionRef?.toLowerCase().includes(search)
    );
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Salary Disbursements</h1>
            <p className="text-primary-600 mt-1">Track and manage salary payments</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="btn-modern btn-primary flex items-center space-x-2"
              disabled={selectedIds.length === 0}
            >
              <Download className="w-4 h-4" />
              <span>Generate Payment File</span>
            </button>
            <button
              onClick={() => setShowReconcileModal(true)}
              className="btn-modern bg-purple-600 hover:bg-purple-700 text-white flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Reconcile</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="card-modern bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{stats.totalCount || 0}</p>
                  <p className="text-sm text-blue-700 mt-1">{formatCurrency(stats.totalAmount || 0)}</p>
                </div>
                <DollarSign className="w-10 h-10 text-blue-400" />
              </div>
            </div>

            <div className="card-modern bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.pendingCount || 0}</p>
                  <p className="text-sm text-yellow-700 mt-1">{formatCurrency(stats.pendingAmount || 0)}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-400" />
              </div>
            </div>

            <div className="card-modern bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Processing</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{stats.processingCount || 0}</p>
                  <p className="text-sm text-blue-700 mt-1">{formatCurrency(stats.processingAmount || 0)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-400" />
              </div>
            </div>

            <div className="card-modern bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Completed</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{stats.completedCount || 0}</p>
                  <p className="text-sm text-green-700 mt-1">{formatCurrency(stats.completedAmount || 0)}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
            </div>

            <div className="card-modern bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Failed</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">{stats.failedCount || 0}</p>
                  <p className="text-sm text-red-700 mt-1">{formatCurrency(stats.failedAmount || 0)}</p>
                </div>
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card-modern">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </label>
              <input
                type="text"
                placeholder="Employee, code, ref..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="input-modern"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input-modern"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Payment Method</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                className="input-modern"
              >
                <option value="">All Methods</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="input-modern"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="input-modern"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="card-modern bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-blue-900">
                {selectedIds.length} disbursement(s) selected
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusUpdate('PROCESSING')}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Mark Processing
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('COMPLETED')}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('FAILED')}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Mark Failed
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Disbursements Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : filteredDisbursements.length === 0 ? (
          <div className="card-modern p-12 text-center">
            <DollarSign className="w-16 h-16 mx-auto text-primary-400 mb-4" />
            <h3 className="text-lg font-medium text-primary-900 mb-2">No disbursements found</h3>
            <p className="text-primary-600">Disbursements will appear here after payslips are approved</p>
          </div>
        ) : (
          <div className="card-modern overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-50 border-b border-primary-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredDisbursements.length && filteredDisbursements.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-primary-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-primary-900">Employee</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-primary-900">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-primary-900">Payment Method</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-primary-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-primary-900">Transaction Ref</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-primary-900">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-primary-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {filteredDisbursements.map((disbursement) => {
                    const statusConfig = getStatusConfig(disbursement.status);
                    const StatusIcon = statusConfig.icon;
                    const PaymentIcon = getPaymentMethodIcon(disbursement.paymentMethod);

                    return (
                      <tr key={disbursement.id} className="hover:bg-primary-50 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(disbursement.id)}
                            onChange={() => toggleSelection(disbursement.id)}
                            className="rounded border-primary-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-primary-900">
                              {disbursement.employee?.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-primary-600">
                              {disbursement.employee?.employeeCode || 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-primary-900">
                            {formatCurrency(disbursement.amount)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <PaymentIcon className="w-4 h-4 text-primary-600" />
                            <span className="text-sm text-primary-700">
                              {disbursement.paymentMethod.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-primary-700">
                            {disbursement.transactionRef || '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-primary-700">
                            {disbursement.paymentDate 
                              ? formatDate(disbursement.paymentDate)
                              : formatDate(disbursement.createdAt)
                            }
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/hr/payroll/disbursements/${disbursement.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment File Generator Modal */}
      {showPaymentModal && (
        <PaymentFileGenerator
          selectedDisbursements={disbursements.filter(d => selectedIds.includes(d.id))}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            fetchDisbursements();
            fetchStats();
          }}
        />
      )}

      {/* Reconciliation Upload Modal */}
      {showReconcileModal && (
        <ReconciliationUpload
          onClose={() => setShowReconcileModal(false)}
          onSuccess={() => {
            setShowReconcileModal(false);
            fetchDisbursements();
            fetchStats();
          }}
        />
      )}
    </Layout>
  );
}
