import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInventoryStore } from '../../store/inventory.store';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Package, DollarSign, AlertTriangle, Plus, Eye } from 'lucide-react';

const UserDashboard = () => {
  const { items, loading, error, fetchItems } = useInventoryStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">{error}</div>;

  const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const lowStockItems = items.filter(item => item.quantity < 10).length;
  const recentItems = items.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back!</h1>
        <p className="text-gray-600 mt-1">Here's your inventory overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalValue.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="modern-card-elevated p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{lowStockItems}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="modern-card-elevated p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/inventory" className="btn-modern btn-primary text-center p-4 rounded-lg">
            <Eye className="w-5 h-5 mx-auto mb-2" />
            <div className="text-sm font-medium">View Inventory</div>
          </Link>
          <Link to="/inventory" className="btn-modern btn-secondary text-center p-4 rounded-lg">
            <Plus className="w-5 h-5 mx-auto mb-2" />
            <div className="text-sm font-medium">Add Item</div>
          </Link>
        </div>
      </div>

      <div className="modern-card-elevated p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Items</h2>
        {recentItems.length > 0 ? (
          <div className="space-y-3">
            {recentItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₹{item.price}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No items found</p>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;