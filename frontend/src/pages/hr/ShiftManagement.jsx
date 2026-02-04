import React, { useState, useEffect } from 'react';
import { Briefcase, Clock, Users, Plus, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '../../api/http';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ShiftManagement = ({ employeeId }) => {
  const [shifts, setShifts] = useState([]);
  const [employeeShift, setEmployeeShift] = useState(null);
  const [shiftHistory, setShiftHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState('');

  useEffect(() => {
    loadShiftData();
  }, [employeeId]);

  const loadShiftData = async () => {
    setLoading(true);
    try {
      const [shiftsRes, currentRes, historyRes] = await Promise.all([
        apiClient.get('/attendance/shifts'),
        apiClient.get(`/attendance/shifts/employee/${employeeId}`),
        apiClient.get(`/shifts/employee/${employeeId}?limit=5`)
      ]);

      setShifts(shiftsRes.data?.data || []);
      setEmployeeShift(currentRes.data?.data || null);
      setShiftHistory(historyRes.data?.data || []);
    } catch (err) {
      setError('Failed to load shift data');
      console.error('Error loading shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignShift = async () => {
    if (!selectedShiftId) {
      setError('Please select a shift');
      return;
    }

    try {
      await apiClient.post('/attendance/shifts/assign', {
        employeeId,
        shiftId: selectedShiftId
      });

      setSuccess('Shift assigned successfully!');
      setShowAssignForm(false);
      setSelectedShiftId('');
      loadShiftData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign shift');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Current Shift */}
      {employeeShift && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Your Current Shift
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-600 text-sm mb-1">Shift Name</p>
              <p className="text-lg font-semibold text-gray-800">{employeeShift.name}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Start Time</p>
              <p className="text-lg font-semibold text-gray-800">{employeeShift.startTime}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">End Time</p>
              <p className="text-lg font-semibold text-gray-800">{employeeShift.endTime}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Break Duration</p>
              <p className="text-lg font-semibold text-gray-800">{employeeShift.breakDuration} mins</p>
            </div>
          </div>
        </div>
      )}

      {/* Assign Shift Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Available Shifts</h3>
          <button
            onClick={() => setShowAssignForm(!showAssignForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Assign Shift
          </button>
        </div>

        {showAssignForm && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Shift</label>
                <select
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a shift...</option>
                  {shifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name} ({shift.startTime} - {shift.endTime})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAssignShift}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Assign
                </button>
                <button
                  onClick={() => setShowAssignForm(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* All Shifts Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Shift Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Start Time</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">End Time</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Break</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned Employees</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map(shift => (
                <tr key={shift.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-800 font-semibold">{shift.name}</td>
                  <td className="py-3 px-4 text-gray-600">{shift.startTime}</td>
                  <td className="py-3 px-4 text-gray-600">{shift.endTime}</td>
                  <td className="py-3 px-4 text-gray-600">{shift.breakDuration} mins</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 text-blue-600 font-semibold">
                      <Users className="w-4 h-4" />
                      {shift.shiftAssignments?.length || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shift History */}
      {shiftHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Shift History</h3>
          <div className="space-y-3">
            {shiftHistory.map(record => (
              <div key={record.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-800">{record.shift.name}</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    record.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {record.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  From: {new Date(record.assignedFrom).toLocaleDateString()}
                  {record.assignedTo && ` to ${new Date(record.assignedTo).toLocaleDateString()}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManagement;
