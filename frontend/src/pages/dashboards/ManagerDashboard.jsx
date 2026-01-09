import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInventoryStore } from '../../store/inventory.store';
import { useDepartmentsStore } from '../../store/departments.store';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ManagerDashboard = () => {
  const { items, loading: itemsLoading, fetchItems } = useInventoryStore();
  const { departments, loading: deptsLoading, fetchDepartments } = useDepartmentsStore();

  useEffect(() => {
    fetchItems();
    fetchDepartments();
  }, [fetchItems, fetchDepartments]);

  const loading = itemsLoading || deptsLoading;
  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage operations and oversee departments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-3xl font-bold text-gray-900">{items.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 text-2xl">📦</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-3xl font-bold text-gray-900">{departments.length}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600 text-2xl">🏢</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 text-2xl">⏳</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Workflows</p>
              <p className="text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100 text-orange-600 text-2xl">⚡</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Manager Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/departments" className="bg-indigo-600 text-white p-4 rounded-lg hover:bg-indigo-700 transition-colors text-center">
            <div className="text-2xl mb-2">🏢</div>
            <div className="text-sm font-medium">Manage Departments</div>
          </Link>
          <Link to="/workflows" className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors text-center">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-sm font-medium">Workflows</div>
          </Link>
          <Link to="/approvals" className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 transition-colors text-center">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-sm font-medium">Approvals</div>
          </Link>
          <Link to="/reports" className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium">Reports</div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Departments</h2>
          {departments.length > 0 ? (
            <div className="space-y-3">
              {departments.slice(0, 5).map((dept) => (
                <div key={dept.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{dept.name}</p>
                    <p className="text-sm text-gray-500">ID: {dept.id}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No departments found</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activities</h2>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">System initialized</p>
                <p className="text-xs text-gray-500">Ready for operations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;