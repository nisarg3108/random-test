import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Calendar, Download, TrendingUp, Users } from 'lucide-react';
import { apiClient } from '../../api/http';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AttendanceReports = ({ employeeId, departmentId }) => {
  const [reportType, setReportType] = useState('employee');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [teamReport, setTeamReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (reportType === 'employee' && employeeId) {
      fetchEmployeeReport();
    } else if (reportType === 'team' && departmentId) {
      fetchTeamReport();
    }
  }, [reportType, selectedMonth, selectedYear, employeeId, departmentId]);

  const fetchEmployeeReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(
        `/attendance/reports/${employeeId}?month=${selectedMonth}&year=${selectedYear}`
      );
      setReport(res.data?.data);
    } catch (err) {
      setError('Failed to fetch attendance report');
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(
        `/attendance/reports/department/${departmentId}?month=${selectedMonth}&year=${selectedYear}`
      );
      setTeamReport(res.data?.data);
    } catch (err) {
      setError('Failed to fetch team report');
      console.error('Error fetching team report:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const content = reportType === 'employee' ? report : teamReport;
    if (!content) return;

    // Simple PDF generation (you can use libraries like jspdf for more features)
    const printWindow = window.open('', '', 'height=400,width=800');
    printWindow.document.write(`
      <html>
        <head><title>Attendance Report</title></head>
        <body>
          <h1>Attendance Report</h1>
          <p>Month: ${selectedMonth}/${selectedYear}</p>
          <pre>${JSON.stringify(content, null, 2)}</pre>
          <button onclick="window.print()">Print</button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Attendance Reports</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="employee">Employee Report</option>
              <option value="team">Team Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {monthNames.map((month, idx) => (
                <option key={idx} value={idx + 1}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={generatePDF}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Employee Report */}
      {reportType === 'employee' && report && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600 text-sm mb-2">Present Days</p>
              <p className="text-3xl font-bold text-green-600">{report.presentDays}</p>
              <p className="text-gray-500 text-xs mt-2">out of {report.totalWorkingDays} working days</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600 text-sm mb-2">Absent Days</p>
              <p className="text-3xl font-bold text-red-600">{report.absentDays}</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600 text-sm mb-2">Leave Days</p>
              <p className="text-3xl font-bold text-yellow-600">{report.leaveDays}</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600 text-sm mb-2">Attendance %</p>
              <p className="text-3xl font-bold text-blue-600">{report.attendancePercentage}%</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Pie Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Present', value: report.presentDays, fill: '#22c55e' },
                      { name: 'Absent', value: report.absentDays, fill: '#ef4444' },
                      { name: 'Leave', value: report.leaveDays, fill: '#eab308' },
                      { name: 'Half Day', value: report.halfDays, fill: '#f97316' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#eab308" />
                    <Cell fill="#f97316" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Work Hours Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Work Hours Summary</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  {
                    name: 'Hours',
                    'Regular Work': report.totalWorkHours - report.totalOvertimeHours,
                    'Overtime': report.totalOvertimeHours
                  }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Regular Work" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="Overtime" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Total Working Days</p>
                <p className="text-2xl font-bold text-gray-800">{report.totalWorkingDays}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Work Hours</p>
                <p className="text-2xl font-bold text-gray-800">{report.totalWorkHours.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Overtime Hours</p>
                <p className="text-2xl font-bold text-gray-800">{report.totalOvertimeHours.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">WFH Days</p>
                <p className="text-2xl font-bold text-gray-800">{report.workFromHomeDays}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Report */}
      {reportType === 'team' && teamReport && (
        <div className="space-y-6">
          {/* Team Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600 text-sm mb-2">Total Employees</p>
              <p className="text-3xl font-bold text-blue-600">{teamReport.summary.totalEmployees}</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600 text-sm mb-2">Average Attendance</p>
              <p className="text-3xl font-bold text-green-600">{teamReport.summary.averageAttendance}%</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600 text-sm mb-2">Total Overtime Hours</p>
              <p className="text-3xl font-bold text-red-600">{teamReport.summary.totalOvertimeHours}</p>
            </div>
          </div>

          {/* Team Details Table */}
          <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Employee Details</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Present Days</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Absent Days</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Leave Days</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {teamReport.reports.map((emp) => (
                  <tr key={emp.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800">{emp.employee.name}</td>
                    <td className="py-3 px-4 text-green-600 font-semibold">{emp.presentDays}</td>
                    <td className="py-3 px-4 text-red-600 font-semibold">{emp.absentDays}</td>
                    <td className="py-3 px-4 text-yellow-600 font-semibold">{emp.leaveDays}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        emp.attendancePercentage >= 90 ? 'bg-green-100 text-green-800' :
                        emp.attendancePercentage >= 75 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {emp.attendancePercentage}%
                      </span>
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
};

export default AttendanceReports;
