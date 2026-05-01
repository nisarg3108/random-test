import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Timer,
  FileText,
  Play,
  Square
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getToken } from '../../store/auth.store';

const EmployeeAttendance = () => {
  const [profile, setProfile] = useState(null);
  const [report, setReport] = useState(null);
  const [clockStatus, setClockStatus] = useState(null);
  const [shift, setShift] = useState(null);
  const [shiftHistory, setShiftHistory] = useState([]);
  const [overtimeSummary, setOvertimeSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [overtimeLoading, setOvertimeLoading] = useState(false);
  const [error, setError] = useState('');
  const [overtimeMessage, setOvertimeMessage] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [includeLocation, setIncludeLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [isWorkFromHome, setIsWorkFromHome] = useState(false);
  const [overtimeForm, setOvertimeForm] = useState({
    overtimePolicyId: '',
    overtimeHours: '',
    date: new Date().toISOString().split('T')[0],
    dailyRate: '',
    reason: ''
  });

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth, selectedYear]);

  const fetchJson = async (endpoint, options = {}) => {
    const token = getToken();
    const apiBaseUrl = import.meta.env.VITE_API_URL || '';
    const url = apiBaseUrl && endpoint.startsWith('/api/')
      ? `${apiBaseUrl}${endpoint.slice(4)}`
      : endpoint;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = await response.text();

    if (!response.ok) {
      if (response.status === 404 && options.allowNotFound) {
        return null;
      }
      throw new Error(payload || `Request failed with status ${response.status}`);
    }

    if (!contentType.includes('application/json')) {
      throw new Error(`Expected JSON from ${url} but received ${contentType || 'unknown content type'}`);
    }

    const parsed = JSON.parse(payload);
    if (parsed && typeof parsed === 'object' && 'success' in parsed && 'data' in parsed) {
      return parsed.data;
    }

    return parsed;
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError('');

      const employee = await fetchJson('/api/employees/my-profile');
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      const [attendanceReport, status, currentShift, history, overtime] = await Promise.all([
        fetchJson(`/api/attendance/reports/${employee.id}?month=${selectedMonth}&year=${selectedYear}`, { allowNotFound: true }),
        fetchJson(`/api/attendance/clock-status/${employee.id}`),
        fetchJson(`/api/attendance/shifts/employee/${employee.id}`, { allowNotFound: true }),
        fetchJson(`/api/attendance/shifts/history/${employee.id}`, { allowNotFound: true }),
        fetchJson(`/api/attendance/overtime-hours/${employee.id}?date=${todayString}`, { allowNotFound: true })
      ]);

      setProfile(employee);
      setReport(attendanceReport);
      setClockStatus(status);
      setShift(currentShift);
      setShiftHistory(history || []);
      setOvertimeSummary(overtime);
    } catch (err) {
      setError('Unable to load attendance details.');
      console.error('Failed to load employee attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
  const formatTime = (time) => {
    if (!time) return 'N/A';
    return new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getMonthName = (month) => {
    return new Date(2024, month - 1, 1).toLocaleString('en-US', { month: 'long' });
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    if (selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1) {
      return;
    }
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getAttendanceStatus = () => {
    if (!clockStatus) return 'UNKNOWN';
    return clockStatus.status || 'UNKNOWN';
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();
  };

  const getCurrentLocation = async () => {
    if (!includeLocation) return null;
    if (!navigator.geolocation) {
      setLocationStatus('Location not supported in this browser.');
      return null;
    }

    setLocationStatus('Getting location...');

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationStatus('Location captured.');
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        () => {
          setLocationStatus('Unable to read location.');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  const handleClockIn = async () => {
    if (!profile) return;
    try {
      setActionLoading(true);
      setError('');
      const location = await getCurrentLocation();
      await fetchJson('/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: profile.id,
          location,
          isWorkFromHome
        })
      });
      await fetchAttendance();
    } catch (err) {
      setError('Unable to clock in right now.');
      console.error('Clock in failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!profile) return;
    try {
      setActionLoading(true);
      setError('');
      const location = await getCurrentLocation();
      await fetchJson('/api/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: profile.id, location })
      });
      await fetchAttendance();
    } catch (err) {
      setError('Unable to clock out right now.');
      console.error('Clock out failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!profile) return;
    try {
      setReportLoading(true);
      setError('');
      await fetchJson(`/api/attendance/reports/${profile.id}/generate?month=${selectedMonth}&year=${selectedYear}`, {
        method: 'POST'
      });
      await fetchAttendance();
    } catch (err) {
      setError('Unable to generate report right now.');
      console.error('Report generation failed:', err);
    } finally {
      setReportLoading(false);
    }
  };

  const reportData = report || {
    attendancePercentage: 0,
    presentDays: 0,
    leaveDays: 0,
    totalWorkHours: 0,
    totalWorkingDays: 0,
    absentDays: 0,
    totalOvertimeHours: 0,
    status: 'NOT_GENERATED',
    reportDate: null
  };

  const todayRecords = clockStatus?.todayRecords || [];
  const isClockedIn = clockStatus?.isClockedIn;
  const todayDateString = new Date().toISOString().split('T')[0];
  const elapsedHoursLabel = clockStatus?.elapsedHours
    ? `${clockStatus.elapsedHours.toFixed(2)} hrs`
    : '0.00 hrs';

  const handleOvertimeChange = (event) => {
    const { name, value } = event.target;
    setOvertimeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOvertimeSubmit = async (event) => {
    event.preventDefault();
    if (!profile) return;

    try {
      setOvertimeLoading(true);
      setOvertimeMessage('');
      setError('');

      await fetchJson(`/api/attendance/overtime-records/${profile.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overtimePolicyId: overtimeForm.overtimePolicyId || null,
          overtimeHours: parseFloat(overtimeForm.overtimeHours || 0),
          date: overtimeForm.date || todayDateString,
          dailyRate: parseFloat(overtimeForm.dailyRate || 0),
          reason: overtimeForm.reason || ''
        })
      });

      setOvertimeMessage('Overtime request submitted for approval.');
      setOvertimeForm((prev) => ({
        ...prev,
        overtimeHours: '',
        reason: ''
      }));
      await fetchAttendance();
    } catch (err) {
      setError('Unable to submit overtime request.');
      console.error('Overtime request failed:', err);
    } finally {
      setOvertimeLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">My Attendance</h1>
            <p className="text-primary-600 mt-1">View your attendance summary, clock status, and time tracking records</p>
          </div>
          <button
            onClick={fetchAttendance}
            className="btn-modern btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Month/Year Selection */}
        {!loading && !error && (
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary-700">Select Month</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePreviousMonth}
                  className="btn-modern btn-secondary text-sm"
                >
                  ← Previous
                </button>
                <span className="text-lg font-semibold text-primary-900 min-w-[180px] text-center">
                  {getMonthName(selectedMonth)} {selectedYear}
                </span>
                <button
                  onClick={handleNextMonth}
                  disabled={isCurrentMonth()}
                  className="btn-modern btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        )}

        {error && !loading && (
          <div className="modern-card-elevated p-4 flex gap-3 items-start bg-red-50 border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

      {!loading && profile && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <div className="modern-card-elevated p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-600">Attendance</p>
                  <p className="text-2xl font-bold text-primary-900 mt-1">{formatPercent(reportData.attendancePercentage)}</p>
                  <p className="text-xs text-primary-600 mt-1">Monthly percentage</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <CalendarDays className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="modern-card-elevated p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-600">Present Days</p>
                  <p className="text-2xl font-bold text-primary-900 mt-1">{reportData.presentDays || 0}</p>
                  <p className="text-xs text-primary-600 mt-1">Days present</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="modern-card-elevated p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-600">Leave Days</p>
                  <p className="text-2xl font-bold text-primary-900 mt-1">{reportData.leaveDays || 0}</p>
                  <p className="text-xs text-primary-600 mt-1">Approved leaves</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50">
                  <Calendar className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
            <div className="modern-card-elevated p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-600">Work Hours</p>
                  <p className="text-2xl font-bold text-primary-900 mt-1">{reportData.totalWorkHours?.toFixed(1) || '0'}</p>
                  <p className="text-xs text-primary-600 mt-1">Total hours</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Current Status & Monthly Report */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Current Status */}
            <div className="space-y-4">
              <div
                className={`rounded-xl p-6 shadow-lg ${
                  isClockedIn
                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                    : 'bg-gradient-to-br from-gray-500 to-gray-600 text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Status</h3>
                  <div className={`w-3 h-3 rounded-full ${isClockedIn ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold mb-2">{isClockedIn ? 'Clocked In' : 'Clocked Out'}</p>
                  {isClockedIn && clockStatus?.clockInTime ? (
                    <>
                      <p className="text-sm opacity-90 mb-2">Since: {formatTime(clockStatus.clockInTime)}</p>
                      <p className="text-4xl font-bold mb-1">{elapsedHoursLabel}</p>
                      <p className="text-sm opacity-90">Elapsed Time</p>
                    </>
                  ) : (
                    <p className="text-sm opacity-90">Clock in to start your workday</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-primary-200 p-6">
                <h3 className="text-lg font-semibold text-primary-900 mb-4">Actions</h3>

                {!isClockedIn && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg border border-teal-200">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isWorkFromHome}
                        onChange={(event) => setIsWorkFromHome(event.target.checked)}
                        className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
                      />
                      <span className="ml-3 text-sm font-medium text-teal-900">Work From Home</span>
                    </label>
                    <p className="mt-1 ml-8 text-xs text-teal-700">Check this if you're working remotely today</p>
                  </div>
                )}

                <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
                  <label className="inline-flex items-center gap-2 text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      checked={includeLocation}
                      onChange={(event) => setIncludeLocation(event.target.checked)}
                    />
                    Include location
                  </label>
                  {includeLocation && locationStatus ? (
                    <span className="text-xs text-slate-500">{locationStatus}</span>
                  ) : null}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleClockIn}
                    disabled={actionLoading || isClockedIn}
                    className="flex-1 flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                  >
                    {actionLoading ? (
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-5 h-5 mr-2" />
                    )}
                    <span className="font-semibold">Clock In</span>
                  </button>

                  <button
                    onClick={handleClockOut}
                    disabled={actionLoading || !isClockedIn}
                    className="flex-1 flex items-center justify-center px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                  >
                    {actionLoading ? (
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Square className="w-5 h-5 mr-2" />
                    )}
                    <span className="font-semibold">Clock Out</span>
                  </button>
                </div>

                <p className="text-xs text-slate-600 mt-4">Last updated: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>

            {/* Monthly Report */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-lg bg-orange-100 p-2">
                  <CalendarDays className="h-5 w-5 text-orange-700" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Monthly Report</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-slate-500 text-xs mb-1">Employee</p>
                  <p className="font-semibold text-slate-900">{profile.name}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-slate-500 text-xs mb-1">Employee ID</p>
                  <p className="font-mono font-semibold text-slate-900">{profile.employeeCode}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-slate-500 text-xs mb-1">Working Days</p>
                  <p className="font-semibold text-slate-900">{reportData.totalWorkingDays || 0} days</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-slate-500 text-xs mb-1">Absent Days</p>
                  <p className="font-semibold text-slate-900">{reportData.absentDays || 0} days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shift Management */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-lg bg-indigo-100 p-2">
                <Calendar className="h-5 w-5 text-indigo-700" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Shift Management</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500 mb-2">Current Shift</p>
                {shift ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-slate-900">{shift.name}</p>
                    <p className="text-slate-700">{shift.startTime} - {shift.endTime}</p>
                    <p className="text-slate-600">Break: {shift.breakDuration || 0} mins</p>
                    <p className="text-slate-600">Working Days: {shift.workingDays || 'N/A'}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">No active shift assigned.</p>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500 mb-2">Shift History</p>
                {shiftHistory.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {shiftHistory.slice(0, 3).map((item) => (
                      <li key={item.id} className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">{item.shift?.name || 'Shift'}</span>
                        <span className="text-slate-600">{formatDate(item.assignedFrom)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-600">No shift history available.</p>
                )}
              </div>
            </div>
          </div>

          {/* Overtime */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-lg bg-rose-100 p-2">
                <Timer className="h-5 w-5 text-rose-700" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Overtime</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs text-slate-600 mb-2">Today's Work Hours</p>
                <p className="text-2xl font-bold text-rose-900">{overtimeSummary?.totalWorkHours ?? 0} hrs</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs text-slate-600 mb-2">Shift Duration</p>
                <p className="text-2xl font-bold text-rose-900">{overtimeSummary?.shiftDuration ?? 0} hrs</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs text-slate-600 mb-2">Overtime Hours</p>
                <p className="text-2xl font-bold text-rose-900">{overtimeSummary?.overtimeHours ?? 0} hrs</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-600">
              Monthly overtime recorded: <span className="font-semibold text-slate-900">{reportData.totalOvertimeHours || 0} hrs</span>
            </div>
            <form className="mt-6 grid gap-4" onSubmit={handleOvertimeSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-500">Overtime Policy ID</label>
                  <input
                    name="overtimePolicyId"
                    value={overtimeForm.overtimePolicyId}
                    onChange={handleOvertimeChange}
                    placeholder="POLICY_ID"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Overtime Hours</label>
                  <input
                    name="overtimeHours"
                    value={overtimeForm.overtimeHours}
                    onChange={handleOvertimeChange}
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder="2.5"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Date</label>
                  <input
                    name="date"
                    value={overtimeForm.date}
                    onChange={handleOvertimeChange}
                    type="date"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Daily Rate</label>
                  <input
                    name="dailyRate"
                    value={overtimeForm.dailyRate}
                    onChange={handleOvertimeChange}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="500"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500">Reason</label>
                <textarea
                  name="reason"
                  value={overtimeForm.reason}
                  onChange={handleOvertimeChange}
                  rows={3}
                  placeholder="Describe the overtime work"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={overtimeLoading}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {overtimeLoading ? 'Submitting...' : 'Request Overtime'}
                </button>
                {overtimeMessage ? <span className="text-sm text-green-600">{overtimeMessage}</span> : null}
              </div>
            </form>
          </div>

          {/* Reports */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2">
                  <FileText className="h-5 w-5 text-emerald-700" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Reports</h2>
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={reportLoading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {reportLoading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500 mb-1">Report Status</p>
                <p className="font-semibold text-slate-900">{reportData.status || 'NOT_GENERATED'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500 mb-1">Report Date</p>
                <p className="font-semibold text-slate-900">{formatDate(reportData.reportDate)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500 mb-1">Month</p>
                <p className="font-semibold text-slate-900">{getMonthName(selectedMonth)} {selectedYear}</p>
              </div>
            </div>
          </div>

          {/* Daily Attendance Records */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">Today's Time Tracking</h2>
            {todayRecords.length === 0 ? (
              <p className="text-sm text-slate-600">No time tracking records found for today.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-slate-500">
                    <tr>
                      <th className="pb-3">Check In</th>
                      <th className="pb-3">Check Out</th>
                      <th className="pb-3">Work Hours</th>
                      <th className="pb-3">Overtime</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todayRecords.map((record) => (
                      <tr key={record.id} className="text-slate-700">
                        <td className="py-3 font-mono">{formatTime(record.checkInTime)}</td>
                        <td className="py-3 font-mono">{formatTime(record.checkOutTime)}</td>
                        <td className="py-3">{record.workHours ?? 0} hrs</td>
                        <td className="py-3">{record.overtimeHours ?? 0} hrs</td>
                        <td className="py-3 font-semibold text-slate-900">{record.attendanceStatus || 'PRESENT'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Additional Metrics */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">Quick Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-xs text-slate-600 mb-2">Average Daily Hours</p>
                <p className="text-2xl font-bold text-blue-900">
                  {reportData.totalWorkHours && reportData.presentDays ? (reportData.totalWorkHours / reportData.presentDays).toFixed(1) : '0'} hrs
                </p>
              </div>
              <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                <p className="text-xs text-slate-600 mb-2">Attendance Rate</p>
                <p className="text-2xl font-bold text-green-900">{formatPercent(reportData.attendancePercentage)}</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs text-slate-600 mb-2">Remaining Days</p>
                <p className="text-2xl font-bold text-amber-900">
                  {reportData.totalWorkingDays ? (reportData.totalWorkingDays - (reportData.presentDays || 0) - (reportData.leaveDays || 0)).toString() : '0'} days
                </p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                <p className="text-xs text-slate-600 mb-2">Total Records</p>
                <p className="text-2xl font-bold text-purple-900">
                  {(reportData.presentDays || 0) + (reportData.leaveDays || 0)} / {reportData.totalWorkingDays || 0}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </Layout>
  );
};

export default EmployeeAttendance;