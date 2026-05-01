import { useState, useEffect } from 'react';
import { DollarSign, Download, Calendar, TrendingUp } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import selfServiceAPI from '../../api/selfService';

const MySalary = () => {
  const [salaryInfo, setSalaryInfo] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching salary data...');
      
      const salaryRes = await selfServiceAPI.getMySalaryInfo();
      console.log('Salary response:', salaryRes);
      setSalaryInfo(salaryRes);
      
      const payslipsRes = await selfServiceAPI.getMyPayslips({ limit: 12 });
      console.log('Payslips response:', payslipsRes);
      setPayslips(Array.isArray(payslipsRes) ? payslipsRes : []);
    } catch (error) {
      console.error('Error fetching salary data:', error);
      setError(error.message || 'Failed to load salary data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPayslip = async (id) => {
    try {
      const payslip = await selfServiceAPI.downloadPayslip(id);
      console.log('Payslip data:', payslip);
      
      const content = `
PAYSLIP
Employee: ${payslip.employee.name}
Employee Code: ${payslip.employee.employeeCode}
Payslip Number: ${payslip.payslipNumber}
Period: ${new Date(payslip.payrollCycle.startDate).toLocaleDateString()} - ${new Date(payslip.payrollCycle.endDate).toLocaleDateString()}

EARNINGS:
Basic Salary: ₹${payslip.basicSalary.toFixed(2)}
Gross Salary: ₹${payslip.grossSalary.toFixed(2)}

DEDUCTIONS:
Total Deductions: ₹${payslip.totalDeductions.toFixed(2)}

NET SALARY: ₹${payslip.netSalary.toFixed(2)}
      `;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payslip.payslipNumber}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading payslip:', error);
      alert('Failed to download payslip');
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
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">My Salary</h1>
            <p className="text-primary-600 mt-1">View your salary details and download payslips</p>
          </div>
          <div className="modern-card-elevated p-6">
            <div className="text-red-600">
              <p className="font-semibold">Error loading salary data</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const { employee, salaryStructure } = salaryInfo || {};

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">My Salary</h1>
          <p className="text-primary-600 mt-1">View your salary details and download payslips</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="modern-card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Basic Salary</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">₹{salaryStructure?.basicSalary?.toLocaleString() || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Net Salary</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">₹{salaryStructure?.netSalary?.toLocaleString() || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="modern-card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Effective From</p>
                <p className="text-lg font-semibold text-primary-900 mt-1">
                  {salaryStructure?.effectiveFrom 
                    ? new Date(salaryStructure.effectiveFrom).toLocaleDateString() 
                    : 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {salaryStructure && (
          <div className="modern-card-elevated">
            <div className="px-6 py-4 border-b border-primary-200">
              <h2 className="text-lg font-semibold text-primary-900">Salary Breakdown</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-green-600">Allowances</h3>
                  {salaryStructure.allowances && Object.entries(salaryStructure.allowances).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-primary-100">
                      <span className="capitalize text-primary-700">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="font-semibold text-primary-900">₹{value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-red-600">Deductions</h3>
                  {salaryStructure.deductions && Object.entries(salaryStructure.deductions).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-primary-100">
                      <span className="capitalize text-primary-700">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="font-semibold text-primary-900">₹{value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">Payslip History</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">Payslip Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">Gross Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">Net Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-primary-200">
                  {payslips.map((payslip) => (
                    <tr key={payslip.id} className="hover:bg-primary-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        {new Date(payslip.generatedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">{payslip.payslipNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">₹{payslip.grossSalary.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-900">₹{payslip.netSalary.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          payslip.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          payslip.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payslip.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDownloadPayslip(payslip.id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payslips.length === 0 && (
                <div className="text-center py-8">
                  <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No payslips available yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MySalary;
