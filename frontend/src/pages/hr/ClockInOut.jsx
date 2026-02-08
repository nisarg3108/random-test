import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, AlertCircle, CheckCircle, MapPin, RefreshCw } from 'lucide-react';
import { apiClient } from '../../api/http';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ClockInOut = ({ employeeId: propEmployeeId }) => {
  const [clockStatus, setClockStatus] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isStandalone = !propEmployeeId;
  const employeeId = propEmployeeId || employee?.id;

  useEffect(() => {
    if (isStandalone) {
      loadEmployee();
    }
  }, [isStandalone]);

  useEffect(() => {
    if (employeeId) {
      fetchClockStatus();
    }
  }, [employeeId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if (clockStatus?.isClocked) {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [clockStatus]);

  const loadEmployee = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/employees/my-profile');
      setEmployee(res.data?.data);
    } catch (err) {
      setError('Failed to load employee data');
      console.error('Error loading employee:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClockStatus = async () => {
    try {
      const res = await apiClient.get(`/attendance/clock-status/${employeeId}`);
      setClockStatus(res.data?.data);
      if (res.data?.data?.isClocked) {
        setElapsedTime(Math.floor(res.data?.data?.elapsedHours * 3600));
      }
    } catch (err) {
      console.error('Error fetching clock status:', err);
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const location = await getLocation();
      
      await apiClient.post('/attendance/clock-in', {
        location: location || 'Unknown'
      });

      setSuccess('Successfully clocked in!');
      
      // Fetch updated clock status to get isLate flag
      setTimeout(async () => {
        await fetchClockStatus();
      }, 500);
      setElapsedTime(0);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clock in');
      // Refresh status in case of error to show current state
      setTimeout(async () => {
        await fetchClockStatus();
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const location = await getLocation();
      
      await apiClient.post('/attendance/clock-out', {
        location: location || 'Unknown'
      });

      setSuccess('Successfully clocked out!');
      setClockStatus({ isClocked: false, clockedIn: null });
      setElapsedTime(0);
      
      setTimeout(() => {
        setSuccess('');
        fetchClockStatus();
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  const getLocation = async () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            resolve(`${position.coords.latitude},${position.coords.longitude}`);
          },
          () => {
            resolve(null);
          }
        );
      } else {
        resolve(null);
      }
    });
  };

  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isAfterDeadline = () => {
    const deadline = new Date();
    deadline.setHours(9, 0, 0, 0);
    return currentTime > deadline;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading && !employeeId) {
    return isStandalone ? (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    ) : <LoadingSpinner />;
  }

  const content = (
    <div className="space-y-6">
      {isStandalone && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Clock In/Out</h1>
            <p className="text-primary-600 mt-1">Record your work attendance</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Clock In/Out</h2>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchClockStatus}
            disabled={loading}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Refresh Status"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className="text-right">
            <p className="text-sm text-gray-600">Current Time</p>
            <p className="text-2xl font-bold text-gray-800">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Deadline: 09:00 AM
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {!clockStatus?.isClocked && isAfterDeadline() && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-yellow-800 font-semibold">Late Clock-In Warning</p>
            <p className="text-yellow-700 text-sm">You are clocking in after 9:00 AM. This will be marked as a late arrival and may affect your salary.</p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Current Status</p>
          <div className="text-4xl font-bold text-blue-600 mb-4">
            {clockStatus?.isClocked ? formatElapsedTime(elapsedTime) : '--:--:--'}
          </div>
          <p className="text-lg font-semibold text-gray-700">
            {clockStatus?.isClocked ? 'Currently Clocked In' : 'Not Clocked In'}
          </p>
          {clockStatus?.clockedIn && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Clocked in at {new Date(clockStatus.clockedIn).toLocaleTimeString()}
              </p>
              {clockStatus?.isLate && (
                <p className="text-sm text-orange-600 font-semibold mt-1 flex items-center justify-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Marked as Late - Half-day deduction may apply
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleClockIn}
          disabled={clockStatus?.isClocked || loading}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
            clockStatus?.isClocked || loading
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          <LogIn className="w-5 h-5" />
          Clock In
        </button>
        <button
          onClick={handleClockOut}
          disabled={!clockStatus?.isClocked || loading}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
            !clockStatus?.isClocked || loading
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          <LogOut className="w-5 h-5" />
          Clock Out
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <p className="text-sm text-gray-600">
            <strong>Location Tracking:</strong> Your location is being recorded for security purposes.
          </p>
        </div>
      </div>
      </div>
    </div>
  );

  return isStandalone ? <Layout>{content}</Layout> : content;
};

export default ClockInOut;
