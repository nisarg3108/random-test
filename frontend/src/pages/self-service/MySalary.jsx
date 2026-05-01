import { useState, useEffect } from 'react';
import { DollarSign, Download, Calendar, TrendingUp } from 'lucide-react';
import selfServiceAPI from '../../api/selfService';

const MySalary = () => {
  const [salaryInfo, setSalaryInfo] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salaryRes, payslipsRes] = await Promise.all([
        selfServiceAPI.getMySalaryInfo(),
        selfServiceAPI.getMyPayslips({ limit: 12 })
      ]);
      setSalaryInfo(salaryRes.data);
      setPayslips(payslipsRes.data);
    } catch (error) {
      console.error('Error fetching salary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPayslip = async (id) => {
    try {
      const response = await selfServiceAPI.downloadPayslip(id);
      const payslip = response.data;
      
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
    return <div className="p-6">Loading...</div>;
  }

  const { employee, salaryStructure } = salaryInfo || {};

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Salary</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Basic Salary</p>
              <p className="text-2xl font-bold">₹{salaryStructure?.basicSalary?.toLocaleString() || 0}</p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Net Salary</p>
              <p className="text-2xl font-bold">₹{salaryStructure?.netSalary?.toLocaleString() || 0}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Effective From</p>
              <p className="text-lg font-semibold">
                {salaryStructure?.effectiveFrom 
                  ? new Date(salaryStructure.effectiveFrom).toLocaleDateString() 
                  : 'N/A'}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {salaryStructure && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Salary Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 text-green-600">Allowances</h3>
              {salaryStructure.allowances && Object.entries(salaryStructure.allowances).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="font-semibold">₹{value.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-red-600">Deductions</h3>
              {salaryStructure.deductions && Object.entries(salaryStructure.deductions).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="font-semibold">₹{value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Payslip History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payslip Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payslips.map((payslip) => (
                <tr key={payslip.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(payslip.generatedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{payslip.payslipNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{payslip.grossSalary.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">₹{payslip.netSalary.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
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
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
            <div className="text-center py-8 text-gray-500">
              No payslips available yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MySalary;
