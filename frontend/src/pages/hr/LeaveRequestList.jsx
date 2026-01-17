import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Search, Clock, CheckCircle, XCircle } from 'lucide-react';
import { hrAPI } from '../../api/hr.api';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LeaveRequestList = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const loadLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await hrAPI.getLeaveRequests();
      setLeaveRequests(response.data || []);
    } catch (err) {
      setError('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveTypes = async () => {
    try {
      const response = await hrAPI.getLeaveTypes();
      setLeaveTypes(response.data || []);
    } catch (err) {
      console.error('Failed to load leave types:', err);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await hrAPI.getEmployees();
      setEmployees(response.data || []);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  useEffect(() => {
    loadLeaveRequests();
    loadLeaveTypes();
    loadEmployees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const requestData = {
        ...formData,
        employeeId: parseInt(formData.employeeId),
        leaveTypeId: parseInt(formData.leaveTypeId)
      };

      await hrAPI.createLeaveRequest(requestData);
      setShowModal(false);
      resetForm();
      loadLeaveRequests();
    } catch (err) {
      setError(err.message || 'Failed to create leave request');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      leaveTypeId: '',
      startDate: '',
      endDate: '',
      reason: ''
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = 
      request.employee?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employee?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.leaveType?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter(req => req.status === 'PENDING').length,
    approved: leaveRequests.filter(req => req.status === 'APPROVED').length,
    rejected: leaveRequests.filter(req => req.status === 'REJECTED').length
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Leave Requests</h1>
            <p className="text-primary-600 mt-1">Manage employee leave requests</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-modern btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Request</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Requests', value: stats.total, icon: Calendar, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Pending', value: stats.pending, icon: Clock, bg: 'bg-yellow-50', color: 'text-yellow-600' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle, bg: 'bg-green-50', color: 'text-green-600' },
            { label: 'Rejected', value: stats.rejected, icon: XCircle, bg: 'bg-red-50', color: 'text-red-600' }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="modern-card-elevated p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-600">{stat.label}</p>
                    <p className="text-xl font-bold text-primary-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="modern-card-elevated p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-modern w-full sm:w-auto"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Leave Requests Table */}
        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">
              Leave Requests ({filteredRequests.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8">
                <LoadingSpinner />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No leave requests found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Leave Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-primary-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {request.employee?.firstName?.[0]}{request.employee?.lastName?.[0]}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-primary-900">
                              {request.employee?.firstName} {request.employee?.lastName}
                            </div>
                            <div className="text-sm text-primary-500">{request.employee?.position}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {request.leaveType?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-primary-900">
                        <div>
                          <div>{new Date(request.startDate).toLocaleDateString()}</div>
                          <div className="text-primary-500">to {new Date(request.endDate).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-primary-900">
                        {calculateDays(request.startDate, request.endDate)} days
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-primary-900 max-w-xs truncate">
                        {request.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Add Leave Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="modern-card-elevated max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-primary-200">
              <h3 className="text-lg font-semibold text-primary-900">New Leave Request</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Employee</label>
                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  required
                  className="input-modern"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} - {emp.position}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Leave Type</label>
                <select
                  name="leaveTypeId"
                  value={formData.leaveTypeId}
                  onChange={handleChange}
                  required
                  className="input-modern"
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Start Date</label>
                  <input
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">End Date</label>
                  <input
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    className="input-modern"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Reason</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows={3}
                  required
                  className="input-modern"
                  placeholder="Enter reason for leave"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn-modern btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-modern btn-primary disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LeaveRequestList;