import React, { useEffect } from 'react';
import { useInventoryStore } from '../../store/inventory.store';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Package, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';

const InventoryDashboard = () => {
  const { items, loading, fetchItems } = useInventoryStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const lowStockItems = items.filter(item => item.quantity < 10).length;
  const outOfStockItems = items.filter(item => item.quantity === 0).length;

  const stats = [
    {
      title: 'Total Items',
      value: totalItems,
      icon: Package,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
      change: '+12%'
    },
    {
      title: 'Total Value',
      value: `₹${totalValue.toFixed(2)}`,
      icon: DollarSign,
      bg: 'bg-emerald-50',
      color: 'text-emerald-600',
      change: '+8%'
    },
    {
      title: 'Low Stock Items',
      value: lowStockItems,
      icon: AlertTriangle,
      bg: 'bg-amber-50',
      color: 'text-amber-600',
      change: '-5%'
    },
    {
      title: 'Out of Stock',
      value: outOfStockItems,
      icon: AlertTriangle,
      bg: 'bg-red-50',
      color: 'text-red-600',
      change: '-2%'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your inventory performance</p>
        </div>
        
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="modern-card-elevated p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${stat.bg}`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <TrendingUp className="w-3 h-3" />
                        <span>{stat.change}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Items */}
            <div className="modern-card-elevated p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Items</h2>
              {items.length > 0 ? (
                <div className="space-y-3">
                  {items.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                        </div>
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
          </>
        )}
      </div>
    </Layout>
  );
};

export default InventoryDashboard;