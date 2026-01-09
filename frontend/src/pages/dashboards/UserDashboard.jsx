import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInventoryStore } from '../../store/inventory.store';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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
        <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
        <p className="text-gray-600 mt-1">Here's your inventory overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-3xl font-bold text-gray-900">₹{totalValue.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600 text-2xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-3xl font-bold text-gray-900">{lowStockItems}</p>
            </div>
            <div className="p-3 rounded-full bg-orange-100 text-orange-600 text-2xl">⚠️</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/inventory" className="bg-indigo-600 text-white p-4 rounded-lg hover:bg-indigo-700 transition-colors text-center">
            <div className="text-2xl mb-2">📋</div>
            <div className="text-sm font-medium">View Inventory</div>
          </Link>
          <Link to="/inventory" className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-center">
            <div className="text-2xl mb-2">➕</div>
            <div className="text-sm font-medium">Add Item</div>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Items</h2>
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