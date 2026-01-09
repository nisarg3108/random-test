import React, { useEffect, useState } from 'react';
import { auditAPI } from '../../api/audit.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { RoleGuard } from '../../hooks/useAuth';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Filter out empty string values
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      console.log('Fetching audit logs with filters:', cleanFilters);
      const response = await auditAPI.getAuditLogs(cleanFilters);
      console.log('Audit logs response:', response);
      console.log('Audit logs data:', response.data);
      console.log('Logs array check:', Array.isArray(response.data.data));
      console.log('First log item:', response.data.data?.[0]);
      setLogs(response.data.data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action) => {
    const colors = {
      'CREATE': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800',
      'LOGIN': 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[action] || 'bg-gray-100 text-gray-800'}`}>
        {action}
      </span>
    );
  };

  const toggleLogDetails = (logId) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  const formatChanges = (changes) => {
    if (!changes) return null;
    
    return (
      <div className="mt-2 p-3 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Changes:</h4>
        <pre className="text-xs text-gray-600 whitespace-pre-wrap">
          {JSON.stringify(changes, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <RoleGuard requiredRole="ADMIN" fallback={
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    }>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-gray-600 mt-1">Track all system activities and changes</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
              <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                  <select
                    name="action"
                    value={filters.action}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Actions</option>
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="LOGIN">Login</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entity</label>
                  <select
                    name="entity"
                    value={filters.entity}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Entities</option>
                    <option value="USER">User</option>
                    <option value="ITEM">Item</option>
                    <option value="DEPARTMENT">Department</option>
                    <option value="ROLE">Role</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </form>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Audit Logs Table */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
              </div>
              <div className="p-6">
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <div className="space-y-4">
                    <div className="mb-4 text-sm text-gray-600">
                      Found {logs?.length || 0} audit logs
                    </div>
                    {logs && logs.length > 0 ? (
                      logs.map((log) => (
                        <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                {getActionBadge(log.action)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900">
                                    {log.description || `${log.action} ${log.entity}`}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    by {log.userInfo?.email || 'Unknown User'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                  <span>Entity: {log.entity}</span>
                                  <span>ID: {log.entityId}</span>
                                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                                  {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleLogDetails(log.id)}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              {expandedLog === log.id ? 'Hide Details' : 'Show Details'}
                            </button>
                          </div>
                          
                          {expandedLog === log.id && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">User Information:</h4>
                                  <div className="text-sm text-gray-600">
                                    <p>Email: {log.userInfo?.email || 'N/A'}</p>
                                    <p>Role: {log.userInfo?.role || 'N/A'}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Info:</h4>
                                  <div className="text-sm text-gray-600">
                                    <p>Timestamp: {new Date(log.timestamp).toLocaleString()}</p>
                                    <p>IP Address: {log.ipAddress || 'N/A'}</p>
                                  </div>
                                </div>
                              </div>
                              {log.changes && formatChanges(log.changes)}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No audit logs found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};

export default AuditLogs;