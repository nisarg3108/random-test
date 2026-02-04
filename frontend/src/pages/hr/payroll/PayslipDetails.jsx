import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import payrollAPI from '../../../api/payrollAPI';
import { ArrowLeft, Download, CheckCircle, Printer } from 'lucide-react';

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
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!payslip) {
    return <div className="p-6 text-center">Payslip not found</div>;
  }

  const allowances = payslip.allowances || {};
  const otherDeductions = payslip.otherDeductions || {};

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        {/* Header */}
        <div className="text-center mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PAYSLIP</h1>
          <p className="text-gray-600">For the period: {formatDate(payslip.payrollCycle?.startDate)} to {formatDate(payslip.payrollCycle?.endDate)}</p>
          <p className="text-sm text-gray-500 mt-1">Payslip #: {payslip.payslipNumber}</p>
        </div>

        {/* Employee Info */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Employee Details</h3>
            <div className="space-y-2">
              <p><span className="text-gray-600">Name:</span> <span className="font-medium">{payslip.employee?.name}</span></p>
              <p><span className="text-gray-600">Employee ID:</span> <span className="font-medium">{payslip.employee?.employeeCode}</span></p>
              <p><span className="text-gray-600">Designation:</span> <span className="font-medium">{payslip.employee?.designation}</span></p>
              <p><span className="text-gray-600">Department:</span> <span className="font-medium">{payslip.employee?.department?.name}</span></p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Payment Info</h3>
            <div className="space-y-2">
              <p><span className="text-gray-600">Payment Date:</span> <span className="font-medium">{formatDate(payslip.payrollCycle?.paymentDate)}</span></p>
              <p><span className="text-gray-600">Working Days:</span> <span className="font-medium">{payslip.workingDays}</span></p>
              <p><span className="text-gray-600">Present Days:</span> <span className="font-medium">{payslip.presentDays}</span></p>
              <p><span className="text-gray-600">Leave Days:</span> <span className="font-medium">{payslip.leaveDays}</span></p>
            </div>
          </div>
        </div>

        {/* Earnings & Deductions */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3 bg-green-50 p-2 rounded">Earnings</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-700">Basic Salary</span>
                <span className="font-medium">{formatCurrency(payslip.basicSalary)}</span>
              </div>
              {Object.entries(allowances).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-700 capitalize">{key.replace('_', ' ')}</span>
                  <span className="font-medium">{formatCurrency(value)}</span>
                </div>
              ))}
              {payslip.bonuses > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-700">Bonuses</span>
                  <span className="font-medium">{formatCurrency(payslip.bonuses)}</span>
                </div>
              )}
              {payslip.overtime > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-700">Overtime</span>
                  <span className="font-medium">{formatCurrency(payslip.overtime)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 font-semibold text-green-700 bg-green-50 px-2 rounded">
                <span>Gross Salary</span>
                <span>{formatCurrency(payslip.grossSalary)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3 bg-red-50 p-2 rounded">Deductions</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-700">Income Tax</span>
                <span className="font-medium">{formatCurrency(payslip.taxDeductions)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-700">Provident Fund</span>
                <span className="font-medium">{formatCurrency(payslip.providentFund)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-700">Insurance</span>
                <span className="font-medium">{formatCurrency(payslip.insurance)}</span>
              </div>
              {Object.entries(otherDeductions).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-700 capitalize">{key.replace('_', ' ')}</span>
                  <span className="font-medium">{formatCurrency(value)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 font-semibold text-red-700 bg-red-50 px-2 rounded">
                <span>Total Deductions</span>
                <span>{formatCurrency(payslip.totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Salary */}
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="text-xl font-semibold text-gray-900">Net Salary</span>
            <span className="text-3xl font-bold text-blue-600">{formatCurrency(payslip.netSalary)}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Amount in words: {/* TODO: Convert to words */}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
          <button onClick={() => window.print()} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          {payslip.status === 'GENERATED' && (
            <button onClick={handleApprove} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approve Payslip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
