import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, AlertCircle, CheckCircle, MapPin } from 'lucide-react';
import { apiClient } from '../../api/http';

const ClockInOut = ({ employeeId }) => {
  const [clockStatus, setClockStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    fetchClockStatus();
    const interval = setInterval(() => {
      if (clockStatus?.isClocked) {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [clockStatus]);

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
        employeeId,
        location: location || 'Unknown'
      });

      setSuccess('Successfully clocked in!');
      setClockStatus({ isClocked: true, clockedIn: new Date() });
      setElapsedTime(0);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clock in');
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
        employeeId,
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Clock In/Out</h2>
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
            <p className="text-sm text-gray-600 mt-2">
              Clocked in at {new Date(clockStatus.clockedIn).toLocaleTimeString()}
            </p>
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
  );
};

export default ClockInOut;
