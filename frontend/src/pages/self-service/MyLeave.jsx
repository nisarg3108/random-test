import { useState, useEffect } from 'react';
import { Calendar, Plus, Clock } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import selfServiceAPI from '../../api/selfService';
import api from '../../api/api';

const MyLeave = () => {
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching leave data...');
      
      const balanceRes = await selfServiceAPI.getMyLeaveBalance();
      console.log('Leave balance:', balanceRes);
      setLeaveBalance(Array.isArray(balanceRes) ? balanceRes : []);
      
      const requestsRes = await api.get('/leave-requests');
      console.log('Leave requests:', requestsRes);
      setLeaveRequests(Array.isArray(requestsRes) ? requestsRes : []);
      
      const typesRes = await api.get('/leave-types');
      console.log('Leave types:', typesRes);
      setLeaveTypes(Array.isArray(typesRes) ? typesRes : []);
    } catch (error) {
      console.error('Error fetching leave data:', error);
      setError(error.message || 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leave-requests', formData);
      alert('Leave request submitted successfully');
      setShowForm(false);
      setFormData({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
      fetchData();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      alert('Failed to submit leave request');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">My Leave</h1>
            <p className="text-primary-600 mt-1">Manage your leave requests and view balance</p>
          </div>
          <div className="modern-card-elevated p-6">
            <div className="text-red-600">
              <p className="font-semibold">Error loading leave data</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">My Leave</h1>
            <p className="text-primary-600 mt-1">Manage your leave requests and view balance</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-modern btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Request Leave
          </button>
        </div>

        {showForm && (
          <div className="modern-card-elevated p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">New Leave Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Leave Type</label>
                <select
                  value={formData.leaveTypeId}
                  onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                  className="w-full border border-primary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-primary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full border border-primary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full border border-primary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-modern btn-primary">
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-modern btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {leaveBalance.map((balance) => (
            <div key={balance.leaveTypeId} className="modern-card-elevated p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary-900">{balance.leaveType}</h3>
                <div className="p-3 rounded-lg bg-blue-50">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-primary-600">Total</span>
                  <span className="font-semibold text-primary-900">{balance.totalDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-primary-600">Used</span>
                  <span className="font-semibold text-red-600">{balance.usedDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-primary-600">Remaining</span>
                  <span className="font-semibold text-green-600">{balance.remainingDays} days</span>
                </div>
              </div>
              <div className="mt-4 bg-primary-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(balance.usedDays / balance.totalDays) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">Leave History</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">Leave Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">End Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-600 uppercase tracking-wider">Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-primary-200">
                  {leaveRequests.map((request) => {
                    const days = Math.ceil((new Date(request.endDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24)) + 1;
                    return (
                      <tr key={request.id} className="hover:bg-primary-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">{request.leaveType?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">{new Date(request.startDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">{new Date(request.endDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">{days} days</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-primary-900">{request.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {leaveRequests.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No leave requests yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MyLeave;
