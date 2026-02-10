import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Users, Clock, History, X } from 'lucide-react';
import axios from 'axios';
import { getToken } from '../../store/auth.store';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function ShiftManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [currentShift, setCurrentShift] = useState(null);
  const [shiftHistory, setShiftHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    workDays: [],
    description: ''
  });

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const weekDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

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
      fetchShifts();
      fetchCurrentShift();
      fetchShiftHistory();
    }
  }, [employeeId]);

  const fetchShifts = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/attendance/shifts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShifts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  };

  const fetchCurrentShift = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/attendance/shifts/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentShift(response.data.data);
    } catch (error) {
      console.error('Error fetching current shift:', error);
    }
  };

  const fetchShiftHistory = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/attendance/shifts/history/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShiftHistory(response.data.data || []);
    } catch (error) {
      console.error('Error fetching shift history:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = getToken();
      
      // Convert workDays array to workingDays string (day numbers)
      const dayMap = {
        'MONDAY': 1,
        'TUESDAY': 2,
        'WEDNESDAY': 3,
        'THURSDAY': 4,
        'FRIDAY': 5,
        'SATURDAY': 6,
        'SUNDAY': 7
      };
      
      const workingDays = formData.workDays
        .map(day => dayMap[day])
        .sort((a, b) => a - b)
        .join(',');
      
      const shiftData = {
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        workingDays: workingDays || '1,2,3,4,5', // Default to weekdays if empty
        description: formData.description
      };
      
      await axios.post(`${API_BASE_URL}/attendance/shifts`, shiftData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Shift created successfully!' });
      setShowModal(false);
      resetForm();
      fetchShifts();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to create shift'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      startTime: '',
      endTime: '',
      workDays: [],
      description: ''
    });
  };

  const toggleWorkDay = (day) => {
    setFormData(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day]
    }));
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

      {/* Current Shift */}
      {currentShift && (
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <h3 className="text-lg font-semibold flex items-center mb-4">
            <Calendar className="w-5 h-5 mr-2" />
            My Current Shift
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm opacity-90">Shift Name</p>
              <p className="text-xl font-bold">{currentShift.shift?.name}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Timings</p>
              <p className="text-xl font-bold">
                {currentShift.shift?.startTime} - {currentShift.shift?.endTime}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-90">Work Days</p>
              <p className="text-sm font-medium">
                {currentShift.shift?.workDays?.join(', ')}
              </p>
            </div>
          </div>
          {currentShift.shift?.description && (
            <p className="mt-4 text-sm opacity-90">{currentShift.shift.description}</p>
          )}
        </div>
      )}

      {/* Create Shift Button */}
      {isAdmin && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-primary-900">All Shifts</h3>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Shift
          </button>
        </div>
      )}

      {/* Shifts List */}
      <div className="bg-white rounded-xl shadow-sm border border-primary-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Shift Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Start Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">End Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Work Days</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    No shifts available
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => (
                  <tr key={shift.id} className="border-b border-primary-100 hover:bg-primary-50">
                    <td className="py-3 px-4 text-sm font-medium text-primary-900">{shift.name}</td>
                    <td className="py-3 px-4 text-sm text-primary-900">{shift.startTime}</td>
                    <td className="py-3 px-4 text-sm text-primary-900">{shift.endTime}</td>
                    <td className="py-3 px-4 text-sm text-primary-900">
                      <div className="flex flex-wrap gap-1">
                        {shift.workDays?.map(day => (
                          <span key={day} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {day}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-primary-600">{shift.description || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shift History */}
      <div className="bg-white rounded-xl shadow-sm border border-primary-200 p-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center">
          <History className="w-5 h-5 mr-2" />
          Shift Assignment History
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Shift Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Start Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">End Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-primary-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {shiftHistory.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500">
                    No shift history available
                  </td>
                </tr>
              ) : (
                shiftHistory.map((history) => (
                  <tr key={history.id} className="border-b border-primary-100">
                    <td className="py-3 px-4 text-sm font-medium text-primary-900">
                      {history.shift?.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-primary-900">
                      {new Date(history.startDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-primary-900">
                      {history.endDate ? new Date(history.endDate).toLocaleDateString() : 'Present'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        history.endDate 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {history.endDate ? 'Past' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Shift Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-primary-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-primary-900">Create New Shift</h3>
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
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Shift Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Work Days *
                </label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWorkDay(day)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        formData.workDays.includes(day)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {loading ? 'Creating...' : 'Create Shift'}
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
