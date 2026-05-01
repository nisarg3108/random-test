import { useEffect, useState } from 'react';
import { Download, Loader2, BadgeIndianRupee, ReceiptText } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">Employee Self-Service</p>
        <h1 className="text-3xl font-bold text-slate-900">My Salary</h1>
        <p className="text-slate-600 mt-2">View your salary structure and download your payslips.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>
      )}

      {!loading && profile && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Employee</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{profile.name}</p>
              <p className="text-sm text-slate-500">{profile.employeeCode}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Designation</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{profile.designation || 'Employee'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Salary Status</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{salary ? 'Available' : 'Not configured'}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <BadgeIndianRupee className="h-5 w-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900">Salary Structure</h2>
              </div>

              {salary ? (
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Basic Salary</span>
                    <span className="font-medium text-slate-900">{formatCurrency(salary.basicSalary)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Net Salary</span>
                    <span className="font-medium text-slate-900">{formatCurrency(salary.netSalary)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Effective From</span>
                    <span className="font-medium text-slate-900">{salary.effectiveFrom ? new Date(salary.effectiveFrom).toLocaleDateString('en-IN') : 'N/A'}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-500">Your salary structure has not been set up yet.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <ReceiptText className="h-5 w-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900">Payslips</h2>
              </div>

              {payslips.length === 0 ? (
                <p className="mt-5 text-sm text-slate-500">No payslips available yet.</p>
              ) : (
                <div className="mt-5 space-y-3">
                  {payslips.map((payslip) => (
                    <div key={payslip.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div>
                        <p className="font-medium text-slate-900">{payslip.payrollCycle?.name || 'Payslip'}</p>
                        <p className="text-sm text-slate-500">{formatCurrency(payslip.netSalary)} · {payslip.status}</p>
                      </div>
                      <button
                        onClick={() => downloadPayslip(payslip)}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
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
        </>
      )}
    </div>
  );
};

export default EmployeeSalary;