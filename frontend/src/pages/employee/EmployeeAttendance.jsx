import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, Loader2, RefreshCw } from 'lucide-react';
import { getToken } from '../../store/auth.store';

const EmployeeAttendance = () => {
  const [profile, setProfile] = useState(null);
  const [report, setReport] = useState(null);
  const [clockStatus, setClockStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchJson = async (endpoint) => {
    const token = getToken();
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError('');

      const employee = await fetchJson('/api/employees/my-profile');
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [attendanceReport, status] = await Promise.all([
        fetchJson(`/api/attendance/reports/${employee.id}?month=${month}&year=${year}`),
        fetchJson(`/api/attendance/clock-status/${employee.id}`),
      ]);

      setProfile(employee);
      setReport(attendanceReport);
      setClockStatus(status);
    } catch (err) {
      setError('Unable to load attendance details.');
      console.error('Failed to load employee attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Employee Self-Service</p>
          <h1 className="text-3xl font-bold text-slate-900">My Attendance</h1>
          <p className="text-slate-600 mt-2">View your attendance summary and current clock status.</p>
        </div>
        <button
          onClick={fetchAttendance}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>
      )}

      {!loading && profile && report && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Attendance</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{formatPercent(report.attendancePercentage)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Present Days</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{report.presentDays || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Leave Days</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{report.leaveDays || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Work Hours</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{report.totalWorkHours || 0}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900">Monthly Report</h2>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Employee</p>
                  <p className="font-medium text-slate-900">{profile.name}</p>
                </div>
                <div>
                  <p className="text-slate-500">Employee Code</p>
                  <p className="font-medium text-slate-900">{profile.employeeCode}</p>
                </div>
                <div>
                  <p className="text-slate-500">Working Days</p>
                  <p className="font-medium text-slate-900">{report.totalWorkingDays || 0}</p>
                </div>
                <div>
                  <p className="text-slate-500">Absent Days</p>
                  <p className="font-medium text-slate-900">{report.absentDays || 0}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Clock3 className="h-5 w-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900">Current Status</h2>
              </div>
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-900">{clockStatus?.status || 'No status available'}</p>
                <p className="mt-2">Clock in: {clockStatus?.clockInTime ? new Date(clockStatus.clockInTime).toLocaleTimeString() : 'N/A'}</p>
                <p>Clock out: {clockStatus?.clockOutTime ? new Date(clockStatus.clockOutTime).toLocaleTimeString() : 'N/A'}</p>
                <p className="mt-2 text-slate-500">Use this page to review your attendance record for the current month.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeAttendance;