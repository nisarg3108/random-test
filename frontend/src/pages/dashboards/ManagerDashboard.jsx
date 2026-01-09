import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInventoryStore } from '../../store/inventory.store';
import { useDepartmentsStore } from '../../store/departments.store';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Package, Building2, Clock, Zap, BarChart3, CheckCircle, Activity } from 'lucide-react';

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
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage operations and oversee departments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="modern-card-elevated p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{items.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="modern-card-elevated p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{departments.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50">
              <Building2 className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="modern-card-elevated p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="modern-card-elevated p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Workflows</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50">
              <Zap className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="modern-card-elevated p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Manager Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/departments" className="btn-modern btn-primary text-center p-4 rounded-lg flex flex-col items-center space-y-2">
            <Building2 className="w-6 h-6" />
            <span className="text-sm font-medium">Manage Departments</span>
          </Link>
          <Link to="/workflows" className="btn-modern btn-secondary text-center p-4 rounded-lg flex flex-col items-center space-y-2">
            <Zap className="w-6 h-6" />
            <span className="text-sm font-medium">Workflows</span>
          </Link>
          <Link to="/approvals" className="btn-modern btn-secondary text-center p-4 rounded-lg flex flex-col items-center space-y-2">
            <CheckCircle className="w-6 h-6" />
            <span className="text-sm font-medium">Approvals</span>
          </Link>
          <Link to="/reports" className="btn-modern btn-secondary text-center p-4 rounded-lg flex flex-col items-center space-y-2">
            <BarChart3 className="w-6 h-6" />
            <span className="text-sm font-medium">Reports</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="modern-card-elevated p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Departments</h2>
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

        <div className="modern-card-elevated p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
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