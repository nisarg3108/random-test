import { useEffect, useState } from 'react';
import { Download, BadgeIndianRupee, ReceiptText } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { employeeAPI } from '../../api/employee.api';
import payrollAPI from '../../api/payrollAPI';

const EmployeeSalary = () => {
  const [profile, setProfile] = useState(null);
  const [salary, setSalary] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSalaryData();
  }, []);

  const fetchSalaryData = async () => {
    try {
      setLoading(true);
      setError('');

      const employeeResponse = await employeeAPI.getMyProfile();
      const employee = employeeResponse.data;
      const [salaryResponse, payslipResponse] = await Promise.all([
        employeeAPI.getSalary(),
        employeeAPI.getPayslips({ employeeId: employee.id }),
      ]);

      setProfile(employee);
      setSalary(salaryResponse.data);
      setPayslips(Array.isArray(payslipResponse.data) ? payslipResponse.data : []);
    } catch (err) {
      console.error('Failed to load salary details:', err);
      setError('Unable to load salary details right now.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPayslip = async (payslip) => {
    try {
      const response = await payrollAPI.downloadPayslip(payslip.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip-${payslip.payslipNumber || payslip.id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download payslip:', err);
      setError('Unable to download payslip.');
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">My Salary</h1>
          <p className="text-primary-600 mt-1">View your salary structure and download your payslips</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        )}

        {error && !loading && (
          <div className="modern-card-elevated p-6">
            <div className="text-red-600">{error}</div>
          </div>
        )}

        {!loading && profile && (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="modern-card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-600">Employee</p>
                    <p className="text-xl font-bold text-primary-900 mt-1">{profile.name}</p>
                    <p className="text-sm text-primary-600">{profile.employeeCode}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50">
                    <BadgeIndianRupee className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="modern-card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-600">Designation</p>
                    <p className="text-xl font-bold text-primary-900 mt-1">{profile.designation || 'Employee'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <BadgeIndianRupee className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="modern-card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-600">Salary Status</p>
                    <p className="text-xl font-bold text-primary-900 mt-1">{salary ? 'Available' : 'Not configured'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50">
                    <ReceiptText className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="modern-card-elevated">
                <div className="px-6 py-4 border-b border-primary-200">
                  <div className="flex items-center gap-3">
                    <BadgeIndianRupee className="h-5 w-5 text-primary-700" />
                    <h2 className="text-lg font-semibold text-primary-900">Salary Structure</h2>
                  </div>
                </div>
                <div className="p-6">
                  {salary ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-primary-100 pb-3">
                        <span className="text-primary-600">Basic Salary</span>
                        <span className="font-semibold text-primary-900">{formatCurrency(salary.basicSalary)}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-primary-100 pb-3">
                        <span className="text-primary-600">Net Salary</span>
                        <span className="font-semibold text-primary-900">{formatCurrency(salary.netSalary)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-primary-600">Effective From</span>
                        <span className="font-semibold text-primary-900">{salary.effectiveFrom ? new Date(salary.effectiveFrom).toLocaleDateString('en-IN') : 'N/A'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BadgeIndianRupee className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-primary-600">Your salary structure has not been set up yet.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="modern-card-elevated">
                <div className="px-6 py-4 border-b border-primary-200">
                  <div className="flex items-center gap-3">
                    <ReceiptText className="h-5 w-5 text-primary-700" />
                    <h2 className="text-lg font-semibold text-primary-900">Payslips</h2>
                  </div>
                </div>
                <div className="p-6">
                  {payslips.length === 0 ? (
                    <div className="text-center py-8">
                      <ReceiptText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-primary-600">No payslips available yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payslips.map((payslip) => (
                        <div key={payslip.id} className="flex items-center justify-between p-4 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors">
                          <div>
                            <p className="font-medium text-primary-900">{payslip.payrollCycle?.name || 'Payslip'}</p>
                            <p className="text-sm text-primary-600">{formatCurrency(payslip.netSalary)} · {payslip.status}</p>
                          </div>
                          <button
                            onClick={() => downloadPayslip(payslip)}
                            className="btn-modern btn-secondary flex items-center gap-2 text-sm"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default EmployeeSalary;