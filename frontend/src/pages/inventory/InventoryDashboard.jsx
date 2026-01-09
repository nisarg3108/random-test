import React, { useEffect } from 'react';
import { useInventoryStore } from '../../store/inventory.store';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const InventoryDashboard = () => {
  const { items, loading, fetchItems } = useInventoryStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const lowStockItems = items.filter(item => item.quantity < 10).length;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Inventory Dashboard</h1>
          
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Total Items</h3>
                <p className="text-3xl font-bold text-indigo-600">{totalItems}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Total Value</h3>
                <p className="text-3xl font-bold text-green-600">₹{totalValue.toFixed(2)}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Low Stock Items</h3>
                <p className="text-3xl font-bold text-red-600">{lowStockItems}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;