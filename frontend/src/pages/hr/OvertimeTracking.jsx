import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { apiClient } from '../../api/http';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const OvertimeTracking = ({ employeeId: propEmployeeId }) => {
  const [overtimeHours, setOvertimeHours] = useState(null);
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    overtimePolicyId: '',
    overtimeHours: '',
    dailyRate: '',
    reason: ''
  });

  const isStandalone = !propEmployeeId;
  const employeeId = propEmployeeId || employee?.id;

  useEffect(() => {
    if (isStandalone) {
      loadEmployee();
    }
  }, [isStandalone]);

  useEffect(() => {
    if (employeeId) {
      loadOvertimeData();
    }
  }, [employeeId, selectedDate]);

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

  const loadOvertimeData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(
        `/attendance/overtime-hours/${employeeId}?date=${selectedDate}`
      );
      setOvertimeHours(res.data?.data || null);
      // In a real scenario, you'd also fetch overtime records here
    } catch (err) {
      console.error('Error loading overtime data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordOvertime = async () => {
    if (!formData.overtimePolicyId || !formData.overtimeHours) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      await apiClient.post(`/attendance/overtime-records/${employeeId}`, {
        overtimePolicyId: formData.overtimePolicyId,
        overtimeHours: parseFloat(formData.overtimeHours),
        date: selectedDate,
        dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : 0,
        reason: formData.reason
      });

      setSuccess('Overtime recorded successfully!');
      setShowForm(false);
      setFormData({
        overtimePolicyId: '',
        overtimeHours: '',
        dailyRate: '',
        reason: ''
      });
      loadOvertimeData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record overtime');
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
            <h1 className="text-2xl font-bold text-primary-900">Overtime Tracking</h1>
            <p className="text-primary-600 mt-1">Track and manage overtime hours</p>
          </div>
        </div>
      )}

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

      {/* Today's Overtime Summary */}
      {overtimeHours && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm mb-2">Total Work Hours</p>
            <p className="text-3xl font-bold text-blue-600">{overtimeHours.totalWorkHours.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">Hours worked today</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm mb-2">Shift Duration</p>
            <p className="text-3xl font-bold text-gray-700">{overtimeHours.shiftDuration.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">Expected shift hours</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm mb-2">Overtime Hours</p>
            <p className={`text-3xl font-bold ${
              overtimeHours.overtimeHours > 0 ? 'text-orange-600' : 'text-gray-400'
            }`}>
              {overtimeHours.overtimeHours.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Extra hours beyond shift</p>
          </div>
        </div>
      )}

      {/* Date Selector and Record Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Record Overtime
            </h3>
            <p className="text-sm text-gray-600 mt-1">Track and request additional work hours</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Record Overtime
          </button>
        </div>

        {showForm && (
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    loadOvertimeData();
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Overtime Hours*</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.overtimeHours}
                  onChange={(e) => setFormData({...formData, overtimeHours: e.target.value})}
                  placeholder="Enter overtime hours"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Overtime Policy*</label>
                <select
                  value={formData.overtimePolicyId}
                  onChange={(e) => setFormData({...formData, overtimePolicyId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select policy...</option>
                  <option value="standard">Standard OT (1.5x rate)</option>
                  <option value="weekend">Weekend OT (2x rate)</option>
                  <option value="holiday">Holiday OT (2.5x rate)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Daily Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.dailyRate}
                  onChange={(e) => setFormData({...formData, dailyRate: e.target.value})}
                  placeholder="Enter hourly rate"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="Why did you work overtime?"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRecordOvertime}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
              >
                Record
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Overtime Information */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg shadow-md p-6 border border-orange-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-600" />
          Overtime Policies
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="font-semibold text-gray-800 mb-2">Standard Overtime</p>
            <p className="text-sm text-gray-700">
              <strong>Rate:</strong> 1.5x<br />
              <strong>Applies:</strong> Weekdays after 8 hours
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-2">Weekend Overtime</p>
            <p className="text-sm text-gray-700">
              <strong>Rate:</strong> 2x<br />
              <strong>Applies:</strong> Saturday & Sunday work
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-2">Holiday Overtime</p>
            <p className="text-sm text-gray-700">
              <strong>Rate:</strong> 2.5x<br />
              <strong>Applies:</strong> Public holidays
            </p>
          </div>
        </div>
      </div>

      {/* Recent Overtime Records */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Overtime Records</h3>
        <div className="space-y-3">
          {overtimeRecords.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No overtime records found</p>
          ) : (
            overtimeRecords.map(record => (
              <div key={record.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-800">
                    {record.overtimeHours} hours OT
                  </p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    record.approvalStatus === 'APPROVED'
                      ? 'bg-green-100 text-green-800'
                      : record.approvalStatus === 'REJECTED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {record.approvalStatus}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(record.date).toLocaleDateString()} • {record.reason}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return isStandalone ? <Layout>{content}</Layout> : content;
};

export default OvertimeTracking;
