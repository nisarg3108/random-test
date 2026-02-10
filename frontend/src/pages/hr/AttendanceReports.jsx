import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, FileText, Calendar, TrendingUp, Users } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../store/auth.store';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function AttendanceReports() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [message, setMessage] = useState({ type: '', text: '' });

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      try {
        const token = getToken();
        const response = await axios.get(`${API_BASE_URL}/employees/my-profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployeeId(response.data.id);
      } catch (error) {
        console.error('Error fetching employee info:', error);
      }
    };
    fetchEmployeeInfo();
  }, []);

  useEffect(() => {
    if (employeeId) {
      fetchReport();
    }
  }, [employeeId, month, year]);

  const fetchReport = async () => {
    if (!employeeId) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = getToken();
      const response = await axios.get(
        `${API_BASE_URL}/attendance/reports/${employeeId}?month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReport(response.data.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setMessage({ type: 'info', text: 'No report found. Click "Generate Report" to create one.' });
        setReport(null);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch report' });
      }
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!employeeId) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = getToken();
      const response = await axios.post(
        `${API_BASE_URL}/attendance/reports/${employeeId}/generate?month=${month}&year=${year}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setReport(response.data.data);
        setMessage({ type: 'success', text: 'Report generated successfully!' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to generate report'
      });
    } finally {
      setLoading(false);
    }
  };

  const getAttendancePercentageColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* Report Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-primary-200 p-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
          Report Configuration
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-primary-700 mb-2">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-primary-700 mb-2">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-primary-700 mb-2">&nbsp;</label>
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <Users className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-sm opacity-90">Present Days</p>
              <p className="text-4xl font-bold mt-2">{report.presentDays}</p>
              <p className="text-sm opacity-75 mt-1">of {report.totalWorkingDays} days</p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
              <Calendar className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-sm opacity-90">Absent Days</p>
              <p className="text-4xl font-bold mt-2">{report.absentDays}</p>
              <p className="text-sm opacity-75 mt-1">unauthorized</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
              <FileText className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-sm opacity-90">Leave Days</p>
              <p className="text-4xl font-bold mt-2">{report.leaveDays}</p>
              <p className="text-sm opacity-75 mt-1">approved leaves</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-sm opacity-90">Attendance %</p>
              <p className="text-4xl font-bold mt-2">{report.attendancePercentage.toFixed(1)}%</p>
              <p className="text-sm opacity-75 mt-1">overall rate</p>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="bg-white rounded-xl shadow-sm border border-primary-200 p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Detailed Statistics</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Metric</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-primary-700">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-primary-100">
                    <td className="py-3 px-4 text-sm text-primary-900">Total Working Days</td>
                    <td className="py-3 px-4 text-sm text-primary-900 text-right font-medium">{report.totalWorkingDays}</td>
                  </tr>
                  <tr className="border-b border-primary-100">
                    <td className="py-3 px-4 text-sm text-primary-900">Present Days</td>
                    <td className="py-3 px-4 text-sm text-primary-900 text-right font-medium">{report.presentDays}</td>
                  </tr>
                  <tr className="border-b border-primary-100">
                    <td className="py-3 px-4 text-sm text-primary-900">Absent Days</td>
                    <td className="py-3 px-4 text-sm text-primary-900 text-right font-medium">{report.absentDays}</td>
                  </tr>
                  <tr className="border-b border-primary-100">
                    <td className="py-3 px-4 text-sm text-primary-900">Leave Days</td>
                    <td className="py-3 px-4 text-sm text-primary-900 text-right font-medium">{report.leaveDays}</td>
                  </tr>
                  <tr className="border-b border-primary-100">
                    <td className="py-3 px-4 text-sm text-primary-900">Half Days</td>
                    <td className="py-3 px-4 text-sm text-primary-900 text-right font-medium">{report.halfDays}</td>
                  </tr>
                  <tr className="border-b border-primary-100">
                    <td className="py-3 px-4 text-sm text-primary-900">Work From Home Days</td>
                    <td className="py-3 px-4 text-sm text-primary-900 text-right font-medium">{report.workFromHomeDays}</td>
                  </tr>
                  <tr className="bg-primary-50 border-b border-primary-100">
                    <td className="py-3 px-4 text-sm font-semibold text-primary-900">Total Work Hours</td>
                    <td className="py-3 px-4 text-sm font-semibold text-primary-900 text-right">{report.totalWorkHours.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-primary-50 border-b border-primary-100">
                    <td className="py-3 px-4 text-sm font-semibold text-primary-900">Total Overtime Hours</td>
                    <td className="py-3 px-4 text-sm font-semibold text-primary-900 text-right">{report.totalOvertimeHours.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="py-3 px-4 text-sm font-bold text-primary-900">Attendance Percentage</td>
                    <td className={`py-3 px-4 text-sm font-bold text-right ${getAttendancePercentageColor(report.attendancePercentage)}`}>
                      {report.attendancePercentage.toFixed(2)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Employee Info */}
            {report.employee && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-primary-900 mb-2">Employee Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-primary-600">Name:</span>{' '}
                    <span className="text-primary-900 font-medium">{report.employee.name}</span>
                  </div>
                  {report.employee.employeeCode && (
                    <div>
                      <span className="text-primary-600">Employee Code:</span>{' '}
                      <span className="text-primary-900 font-medium">{report.employee.employeeCode}</span>
                    </div>
                  )}
                  {report.employee.email && (
                    <div>
                      <span className="text-primary-600">Email:</span>{' '}
                      <span className="text-primary-900 font-medium">{report.employee.email}</span>
                    </div>
                  )}
                  {report.employee.department && (
                    <div>
                      <span className="text-primary-600">Department:</span>{' '}
                      <span className="text-primary-900 font-medium">{report.employee.department.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Visual Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-primary-200 p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Attendance Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-green-600">{report.presentDays}</span>
                </div>
                <p className="text-sm text-primary-600">Present</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-red-600">{report.absentDays}</span>
                </div>
                <p className="text-sm text-primary-600">Absent</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-yellow-600">{report.leaveDays}</span>
                </div>
                <p className="text-sm text-primary-600">Leave</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-purple-600">{report.halfDays}</span>
                </div>
                <p className="text-sm text-primary-600">Half Day</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-blue-600">{report.workFromHomeDays}</span>
                </div>
                <p className="text-sm text-primary-600">WFH</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-gray-50 border border-primary-200 rounded-xl p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No Report Available</p>
          <p className="text-sm text-gray-500 mt-2">
            Click "Generate Report" to create an attendance report for the selected period
          </p>
        </div>
      )}
    </div>
  );
}
