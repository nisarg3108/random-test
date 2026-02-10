import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Play, Square, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../store/auth.store';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function ClockInOut() {
  const [loading, setLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState(null);
  const [clockStatus, setClockStatus] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [isWorkFromHome, setIsWorkFromHome] = useState(false);

  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      setEmployeeLoading(true);
      try {
        const token = getToken();
        const response = await axios.get(`${API_BASE_URL}/employees/my-profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployeeId(response.data.id);
      } catch (error) {
        console.error('Error fetching employee info:', error);
        setMessage({ 
          type: 'error', 
          text: 'Failed to load employee profile. Please ensure you have an employee record linked to your account.' 
        });
      } finally {
        setEmployeeLoading(false);
      }
    };
    fetchEmployeeInfo();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (employeeId) {
      fetchClockStatus();
    }
  }, [employeeId]);

  useEffect(() => {
    if (clockStatus?.isClockedIn && clockStatus?.clockInTime) {
      const interval = setInterval(() => {
        const start = new Date(clockStatus.clockInTime);
        const now = new Date();
        const diff = Math.floor((now - start) / 1000);
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setElapsedTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [clockStatus]);

  const fetchClockStatus = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/attendance/clock-status/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClockStatus(response.data.data);
    } catch (error) {
      console.error('Error fetching clock status:', error);
    }
  };

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation not supported');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => reject(error.message)
      );
    });
  };

  const handleClockIn = async () => {
    if (!employeeId) {
      setMessage({ type: 'error', text: 'Employee information not loaded. Please refresh the page.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const loc = await getLocation();
      setLocation(loc);

      const token = getToken();
      const response = await axios.post(
        `${API_BASE_URL}/attendance/clock-in`,
        { employeeId, location: loc, isWorkFromHome },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Check for late warning message
        if (response.data.data?.lateWarning) {
          setMessage({ 
            type: 'warning', 
            text: response.data.data.lateWarning
          });
        } else {
          setMessage({ 
            type: 'success', 
            text: `Clocked in successfully${isWorkFromHome ? ' (Work From Home)' : ''}!` 
          });
        }
        await fetchClockStatus();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to clock in'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!employeeId) {
      setMessage({ type: 'error', text: 'Employee information not loaded. Please refresh the page.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const loc = await getLocation();
      const token = getToken();
      const response = await axios.post(
        `${API_BASE_URL}/attendance/clock-out`,
        { employeeId, location: loc },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: `Clocked out successfully! Total hours: ${response.data.data.workHours.toFixed(2)}` });
        await fetchClockStatus();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to clock out'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {employeeLoading && (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner />
          <span className="ml-3 text-primary-600">Loading employee information...</span>
        </div>
      )}

      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          message.type === 'warning' ? 'bg-orange-50 text-orange-800 border border-orange-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Time Display */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Current Time
            </h3>
          </div>
          <div className="text-center">
            <p className="text-5xl font-bold mb-2">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </p>
            <p className="text-xl opacity-90">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className={`rounded-xl p-6 shadow-lg ${
          clockStatus?.isClockedIn 
            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
            : 'bg-gradient-to-br from-gray-500 to-gray-600 text-white'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Status</h3>
            <div className={`w-3 h-3 rounded-full ${
              clockStatus?.isClockedIn ? 'bg-white animate-pulse' : 'bg-gray-300'
            }`} />
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold mb-2">
              {clockStatus?.isClockedIn ? 'Clocked In' : 'Clocked Out'}
            </p>
            {clockStatus?.isClockedIn && clockStatus?.clockInTime && (
              <>
                <p className="text-sm opacity-90 mb-2">
                  Since: {new Date(clockStatus.clockInTime).toLocaleTimeString()}
                </p>
                <p className="text-4xl font-bold mb-1">
                  {elapsedTime}
                </p>
                <p className="text-sm opacity-90">Elapsed Time</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Clock In/Out Buttons */}
      <div className="bg-white rounded-xl shadow-sm border border-primary-200 p-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Actions</h3>
        
        {/* Work From Home Toggle */}
        {!clockStatus?.isClockedIn && (
          <div className="mb-4 p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg border border-teal-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isWorkFromHome}
                onChange={(e) => setIsWorkFromHome(e.target.checked)}
                className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
              />
              <span className="ml-3 text-sm font-medium text-teal-900">
                🏠 Work From Home
              </span>
            </label>
            <p className="mt-1 ml-8 text-xs text-teal-700">
              Check this if you're working remotely today
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleClockIn}
            disabled={loading || !employeeId || clockStatus?.isClockedIn}
            className="flex-1 flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Play className="w-5 h-5 mr-2" />
            )}
            <span className="font-semibold">Clock In</span>
          </button>

          <button
            onClick={handleClockOut}
            disabled={loading || !employeeId || !clockStatus?.isClockedIn}
            className="flex-1 flex items-center justify-center px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Square className="w-5 h-5 mr-2" />
            )}
            <span className="font-semibold">Clock Out</span>
          </button>
        </div>

        {location && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          </div>
        )}
      </div>

      {/* Today's Summary */}
      {clockStatus?.todayRecords && clockStatus.todayRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-primary-200 p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">Today's Time Records</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Clock In</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Clock Out</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Hours</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Overtime</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {clockStatus.todayRecords.map((record, index) => (
                  <tr key={index} className="border-b border-primary-100">
                    <td className="py-3 px-4 text-sm text-primary-900">
                      {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-primary-900">
                      {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-primary-900">
                      {record.workHours ? record.workHours.toFixed(2) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {record.overtimeHours > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          +{record.overtimeHours.toFixed(2)} hrs
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        record.status === 'CHECKED_OUT' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status === 'CHECKED_OUT' ? 'Completed' : 'In Progress'}
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
}
