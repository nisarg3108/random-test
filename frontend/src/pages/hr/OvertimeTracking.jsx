import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Clock, Plus, X, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../store/auth.store';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function OvertimeTracking() {
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [overtimeData, setOvertimeData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    hours: '',
    reason: '',
    isHoliday: false
  });

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
    if (employeeId && selectedDate) {
      fetchOvertimeData();
    }
  }, [employeeId, selectedDate]);

  const fetchOvertimeData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_BASE_URL}/attendance/overtime-hours/${employeeId}?date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOvertimeData(response.data.data);
    } catch (error) {
      console.error('Error fetching overtime data:', error);
      setOvertimeData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = getToken();
      await axios.post(
        `${API_BASE_URL}/attendance/overtime-records/${employeeId}`,
        {
          date: selectedDate,
          hours: parseFloat(formData.hours),
          reason: formData.reason,
          isHoliday: formData.isHoliday
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Overtime record submitted successfully!' });
      setShowModal(false);
      resetForm();
      fetchOvertimeData();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit overtime record'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      hours: '',
      reason: '',
      isHoliday: false
    });
  };

  return (
    <div className="space-y-6">
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* Date Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-primary-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">Daily Overtime Tracker</h3>
            <p className="text-sm text-primary-600 mt-1">Select a date to view overtime calculations</p>
          </div>
          <div className="flex gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowModal(true)}
              disabled={!overtimeData || overtimeData.overtimeHours <= 0}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record OT
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : overtimeData ? (
        <>
          {/* Overtime Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-sm opacity-90">Total Work Hours</p>
              <p className="text-4xl font-bold mt-2">{overtimeData.totalWorkHours.toFixed(2)}</p>
              <p className="text-sm opacity-75 mt-1">hours worked</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-sm opacity-90">Shift Duration</p>
              <p className="text-4xl font-bold mt-2">{overtimeData.shiftDuration.toFixed(2)}</p>
              <p className="text-sm opacity-75 mt-1">scheduled hours</p>
            </div>

            <div className={`rounded-xl p-6 text-white shadow-lg ${
              overtimeData.overtimeHours > 0
                ? 'bg-gradient-to-br from-green-500 to-green-600'
                : 'bg-gradient-to-br from-gray-500 to-gray-600'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-sm opacity-90">Overtime Hours</p>
              <p className="text-4xl font-bold mt-2">{overtimeData.overtimeHours.toFixed(2)}</p>
              <p className="text-sm opacity-75 mt-1">
                {overtimeData.overtimeHours > 0 ? 'OT eligible' : 'No overtime'}
              </p>
            </div>
          </div>

          {/* Overtime Policy Info */}
          {overtimeData.policy && (
            <div className="bg-white rounded-xl shadow-sm border border-primary-200 p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
                Overtime Policy
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-primary-600">Policy Name</p>
                  <p className="text-base font-semibold text-primary-900">{overtimeData.policy.name}</p>
                </div>
                <div>
                  <p className="text-sm text-primary-600">Weekday Rate</p>
                  <p className="text-base font-semibold text-primary-900">{overtimeData.policy.weekdayRate}x</p>
                </div>
                <div>
                  <p className="text-sm text-primary-600">Weekend Rate</p>
                  <p className="text-base font-semibold text-primary-900">{overtimeData.policy.weekendRate}x</p>
                </div>
                <div>
                  <p className="text-sm text-primary-600">Holiday Rate</p>
                  <p className="text-base font-semibold text-primary-900">{overtimeData.policy.holidayRate}x</p>
                </div>
              </div>
              {overtimeData.policy.description && (
                <p className="mt-4 text-sm text-primary-600">{overtimeData.policy.description}</p>
              )}
            </div>
          )}

          {overtimeData.overtimeHours <= 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900">No Overtime Detected</p>
                <p className="text-sm text-blue-700 mt-1">
                  Your work hours for this date do not exceed the shift duration. Overtime is calculated when work hours exceed scheduled hours.
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-50 border border-primary-200 rounded-xl p-12 text-center">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No data available for selected date</p>
          <p className="text-sm text-gray-500 mt-2">Select a different date or ensure attendance records exist</p>
        </div>
      )}

      {/* Record Overtime Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="border-b border-primary-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-primary-900">Record Overtime</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium">
                  Overtime Hours for {new Date(selectedDate).toLocaleDateString()}
                </p>
                <p className="text-3xl font-bold text-blue-900 mt-2">
                  {overtimeData?.overtimeHours.toFixed(2)} hours
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Overtime Hours *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={overtimeData?.overtimeHours || 0}
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-primary-600 mt-1">
                  Maximum: {overtimeData?.overtimeHours.toFixed(2)} hours
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Reason *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Reason for overtime work..."
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isHoliday"
                  checked={formData.isHoliday}
                  onChange={(e) => setFormData({ ...formData, isHoliday: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isHoliday" className="ml-2 text-sm text-primary-700">
                  This was a holiday (applies holiday rate)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {loading ? 'Submitting...' : 'Submit Overtime'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
