import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { Package, TrendingUp, AlertTriangle, DollarSign, Wrench, Calendar, Play, CheckCircle } from 'lucide-react';
import { assetAPI } from '../../api/asset.api';

const AssetMaintenance = () => {
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    assetId: '',
    type: 'PREVENTIVE',
    description: '',
    scheduledDate: '',
    cost: 0,
    performedBy: ''
  });

  useEffect(() => {
    fetchMaintenanceRecords();
  }, []);

  const fetchMaintenanceRecords = async () => {
    try {
      const response = await assetAPI.getMaintenanceSchedules();
      setMaintenanceRecords(response.data || []);
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMaintenance = async (id) => {
    if (!window.confirm('Start this maintenance now? This will set the asset status to MAINTENANCE.')) return;
    
    try {
      await assetAPI.startMaintenance(id);
      fetchMaintenanceRecords();
    } catch (error) {
      console.error('Error starting maintenance:', error);
      alert(error.response?.data?.error || 'Failed to start maintenance');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await assetAPI.createMaintenance(formData);
      setShowModal(false);
      setFormData({
        assetId: '',
        type: 'PREVENTIVE',
        description: '',
        scheduledDate: '',
        cost: 0,
        performedBy: ''
      });
      fetchMaintenanceRecords();
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      alert(error.response?.data?.error || 'Failed to create maintenance');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Asset Maintenance</h1>
            <p className="text-gray-600 mt-2">Track and manage asset maintenance schedules</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Wrench className="w-5 h-5 mr-2" />
            Schedule Maintenance
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Maintenance</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{maintenanceRecords.length}</p>
              </div>
              <Wrench className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {maintenanceRecords.filter(m => m.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {maintenanceRecords.filter(m => m.status === 'COMPLETED').length}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Cost</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  ${maintenanceRecords.reduce((sum, m) => sum + (m.cost || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Maintenance Records Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Maintenance Records</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {maintenanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No maintenance records found
                    </td>
                  </tr>
                ) : (
                  maintenanceRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.asset?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.asset?.assetCode || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${record.maintenanceType === 'PREVENTIVE' ? 'bg-blue-100 text-blue-800' : ''}
                          ${record.maintenanceType === 'CORRECTIVE' ? 'bg-orange-100 text-orange-800' : ''}
                          ${record.maintenanceType === 'INSPECTION' ? 'bg-green-100 text-green-800' : ''}
                          ${record.maintenanceType === 'CALIBRATION' ? 'bg-purple-100 text-purple-800' : ''}
                        `}>
                          {record.maintenanceType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{record.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.scheduledDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${record.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${record.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : ''}
                          ${record.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
                          ${record.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' : ''}
                          ${record.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${record.cost?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {record.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleStartMaintenance(record.id)}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                            title="Start Maintenance"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Start
                          </button>
                        )}
                        {record.status === 'IN_PROGRESS' && (
                          <span className="text-blue-600 inline-flex items-center">
                            <Wrench className="w-4 h-4 mr-1" />
                            In Progress
                          </span>
                        )}
                        {record.status === 'COMPLETED' && (
                          <span className="text-green-600 inline-flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Done
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Schedule Maintenance</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asset ID
                  </label>
                  <input
                    type="text"
                    value={formData.assetId}
                    onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="PREVENTIVE">Preventive</option>
                    <option value="CORRECTIVE">Corrective</option>
                    <option value="INSPECTION">Inspection</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Cost
                  </label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Schedule
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

export default AssetMaintenance;
