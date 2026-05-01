import React, { useState, useEffect } from 'react';
import { Calendar, Send, X, AlertCircle } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { hrAPI } from '../../api/hr.api';

const EmployeeLeaveRequest = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      setFetching(true);
      const response = await hrAPI.getLeaveTypes();
      const types = response.data || response;
      console.log('Fetched leave types:', types);
      setLeaveTypes(Array.isArray(types) ? types : []);
    } catch (error) {
      console.error('Error fetching leave types:', error);
      setMessage('Error loading leave types. Please try again.');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('Form data before submit:', formData);
      const response = await hrAPI.createLeaveRequest(formData);
      if (response.data || response.message) {
        setMessage('Leave request submitted successfully!');
        setFormData({
          leaveTypeId: '',
          startDate: '',
          endDate: '',
          reason: ''
        });
      }
    } catch (error) {
      console.error('Leave request error:', error);
      setMessage(`Error: ${error.response?.data?.error || error.message || 'Failed to submit leave request'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (fetching) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Request Leave</h1>
          <p className="text-primary-600 mt-1">Submit your leave request</p>
        </div>
        
        <div className="modern-card-elevated">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {message && (
              <div className={`p-4 rounded-lg flex items-start gap-3 ${
                message.includes('Error') 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message.includes('Error') ? (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <Calendar className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <span>{message}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Leave Type *
              </label>
              {leaveTypes.length === 0 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
                  No leave types available. Please contact your administrator.
                </div>
              ) : (
                <select
                  name="leaveTypeId"
                  value={formData.leaveTypeId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.maxDays} days max)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  min={formData.startDate}
                  className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Reason *
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Please provide a reason for your leave request..."
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setFormData({
                  leaveTypeId: '',
                  startDate: '',
                  endDate: '',
                  reason: ''
                })}
                className="btn-modern btn-secondary flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </button>
              <button
                type="submit"
                disabled={loading || leaveTypes.length === 0}
                className="btn-modern btn-primary flex items-center disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeLeaveRequest;