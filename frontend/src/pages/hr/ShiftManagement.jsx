import React, { useState, useEffect } from 'react';
import { Briefcase, Clock, Users, Plus, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '../../api/http';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ShiftManagement = ({ employeeId: propEmployeeId }) => {
  const [shifts, setShifts] = useState([]);
  const [employeeShift, setEmployeeShift] = useState(null);
  const [shiftHistory, setShiftHistory] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState('');

  // If no employeeId prop, this is a standalone page - fetch current employee
  const isStandalone = !propEmployeeId;
  const employeeId = propEmployeeId || employee?.id;

  useEffect(() => {
    if (isStandalone) {
      loadEmployee();
    }
  }, [isStandalone]);

  useEffect(() => {
    if (employeeId) {
      loadShiftData();
    }
  }, [employeeId]);

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
            <h1 className="text-2xl font-bold text-primary-900">Shift Management</h1>
            <p className="text-primary-600 mt-1">Manage work shifts and assignments</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Current Shift */}
      {employeeShift && (
        <div className="modern-card-elevated p-6">
          <h3 className="text-lg font-bold text-primary-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Your Current Shift
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-primary-600 text-sm mb-1">Shift Name</p>
              <p className="text-lg font-semibold text-primary-900">{employeeShift.name}</p>
            </div>
            <div>
              <p className="text-primary-600 text-sm mb-1">Start Time</p>
              <p className="text-lg font-semibold text-primary-900">{employeeShift.startTime}</p>
            </div>
            <div>
              <p className="text-primary-600 text-sm mb-1">End Time</p>
              <p className="text-lg font-semibold text-primary-900">{employeeShift.endTime}</p>
            </div>
            <div>
              <p className="text-primary-600 text-sm mb-1">Break Duration</p>
              <p className="text-lg font-semibold text-primary-900">{employeeShift.breakDuration} mins</p>
            </div>
          </div>
        </div>
      )}

      {/* Assign Shift Section */}
      <div className="modern-card-elevated">
        <div className="px-6 py-4 border-b border-primary-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-900">Available Shifts</h2>
          <button
            onClick={() => setShowAssignForm(!showAssignForm)}
            className="btn-modern btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Shift</span>
          </button>
        </div>

        {showAssignForm && (
          <div className="p-6 bg-blue-50 border-b border-blue-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-primary-900 mb-2">Select Shift</label>
                <select
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                  className="input-modern"
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
                  className="btn-modern btn-primary"
                >
                  Assign
                </button>
                <button
                  onClick={() => setShowAssignForm(false)}
                  className="btn-modern btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* All Shifts Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8">
              <LoadingSpinner />
            </div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No shifts available</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Shift Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Start Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">End Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Break</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-200">
                {shifts.map(shift => (
                  <tr key={shift.id} className="hover:bg-primary-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-primary-900">{shift.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-primary-900">{shift.startTime}</td>
                    <td className="px-6 py-4 text-sm text-primary-900">{shift.endTime}</td>
                    <td className="px-6 py-4 text-sm text-primary-600">{shift.breakDuration} mins</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-blue-600 font-medium text-sm">
                        <Users className="w-4 h-4" />
                        {shift.shiftAssignments?.length || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Shift History */}
      {shiftHistory.length > 0 && (
        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">Shift History</h2>
          </div>
          <div className="p-6 space-y-3">
            {shiftHistory.map(record => (
              <div key={record.id} className="p-4 border border-primary-200 rounded-lg hover:bg-primary-50 transition">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-primary-900">{record.shift.name}</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    record.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {record.status}
                  </span>
                </div>
                <p className="text-sm text-primary-600">
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

  return isStandalone ? <Layout>{content}</Layout> : content;
};

export default ShiftManagement;
