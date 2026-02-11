import React, { useEffect, useState } from 'react';
import { Users, Plus, Filter, ArrowLeft, AlertTriangle, Clock } from 'lucide-react';
import { assetAPI } from '../../api/asset.api';
import { employeeAPI } from '../../api/employee.api';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const AssetAllocations = () => {
  const navigate = useNavigate();
  const [allocations, setAllocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [overdueCount, setOverdueCount] = useState(0);
  const [formData, setFormData] = useState({
    assetId: '',
    employeeId: '',
    allocatedDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    purpose: '',
    location: '',
  });

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allocationsRes, assetsRes, employeesRes] = await Promise.all([
        assetAPI.getAllocations({ status: filterStatus }),
        assetAPI.getAssets({ status: 'AVAILABLE' }),
        employeeAPI.getEmployees(),
      ]);

      setAllocations(allocationsRes.data || []);
      setAssets(assetsRes.data || []);
      setEmployees(employeesRes.data || []);
      
      // Count overdue allocations
      const allAllocations = allocationsRes.data || [];
      const overdue = allAllocations.filter(a => a.status === 'OVERDUE').length;
      setOverdueCount(overdue);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await assetAPI.allocateAsset(formData);
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to allocate asset');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (id) => {
    const condition = prompt('Enter asset condition (EXCELLENT/GOOD/FAIR/POOR):');
    if (!condition) return;

    const notes = prompt('Any notes about the return?');

    try {
      await assetAPI.returnAsset(id, {
        returnCondition: condition.toUpperCase(),
        returnNotes: notes || '',
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to return asset');
    }
  };

  const resetForm = () => {
    setFormData({
      assetId: '',
      employeeId: '',
      allocatedDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: '',
      purpose: '',
      location: '',
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      RETURNED: 'bg-blue-100 text-blue-800',
      OVERDUE: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/assets')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Asset Allocations</h1>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Allocate Asset
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Allocations</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {allocations.length}
                </p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {allocations.filter(a => a.status === 'ACTIVE').length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div 
            className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setFilterStatus('OVERDUE')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {overdueCount}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            {overdueCount > 0 && (
              <p className="text-xs text-red-600 mt-2">Click to view</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Returned</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {allocations.filter(a => a.status === 'RETURNED').length}
                </p>
              </div>
              <Users className="w-10 h-10 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex gap-4 items-center">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="RETURNED">Returned</option>
              <option value="OVERDUE">Overdue</option>
            </select>
            
            {filterStatus && (
              <button
                onClick={() => setFilterStatus('')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear filter
              </button>
            )}
            
            {filterStatus === 'OVERDUE' && overdueCount > 0 && (
              <div className="ml-auto flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="w-4 h-4" />
                {overdueCount} overdue allocation{overdueCount !== 1 ? 's' : ''} found
              </div>
            )}
          </div>
        </div>

        {/* Allocations List */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allocated Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Return</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allocations.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        No allocations found
                      </td>
                    </tr>
                  ) : (
                    allocations.map((allocation) => {
                      const isOverdue = allocation.status === 'OVERDUE';
                      return (
                      <tr key={allocation.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{allocation.asset?.name}</div>
                            <div className="text-sm text-gray-500">{allocation.asset?.assetCode}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{allocation.employee?.name}</div>
                            <div className="text-sm text-gray-500">{allocation.employee?.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(allocation.allocatedDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {allocation.expectedReturnDate 
                              ? new Date(allocation.expectedReturnDate).toLocaleDateString()
                              : '-'}
                          </div>
                          {isOverdue && allocation.expectedReturnDate && (
                            <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3" />
                              {Math.floor((new Date() - new Date(allocation.expectedReturnDate)) / (1000 * 60 * 60 * 24))} days overdue
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(allocation.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {allocation.purpose || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {(allocation.status === 'ACTIVE' || allocation.status === 'OVERDUE') && (
                            <button
                              onClick={() => handleReturn(allocation.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Return
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Allocation Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Allocate Asset</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asset <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.assetId}
                      onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Asset</option>
                      {assets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.assetCode} - {asset.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} - {emp.employeeCode}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allocated Date
                    </label>
                    <input
                      type="date"
                      value={formData.allocatedDate}
                      onChange={(e) => setFormData({ ...formData, allocatedDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Return Date
                    </label>
                    <input
                      type="date"
                      value={formData.expectedReturnDate}
                      onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purpose
                    </label>
                    <input
                      type="text"
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Allocating...' : 'Allocate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AssetAllocations;
