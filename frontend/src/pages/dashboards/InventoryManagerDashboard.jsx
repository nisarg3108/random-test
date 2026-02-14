import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, TrendingDown, AlertTriangle, BarChart3,
  ShoppingCart, Truck, Archive, FileText
} from 'lucide-react';
import { apiClient } from '../../api/http';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ApprovalWidget from '../../components/approvals/ApprovalWidget';
import ExpenseClaimsWidget from '../../components/dashboard/ExpenseClaimsWidget';
import LeaveRequestWidget from '../../components/dashboard/LeaveRequestWidget';

const InventoryManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    inTransit: 0,
    totalValue: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const inventoryRes = await apiClient.get('/inventory');
      const inventory = inventoryRes.data || [];

      const lowStockItems = inventory.filter(item => 
        item.quantity <= (item.reorderLevel || 10)
      );
      const outOfStockItems = inventory.filter(item => item.quantity === 0);

      setStats({
        totalItems: inventory.length || 0,
        lowStock: lowStockItems.length || 0,
        outOfStock: outOfStockItems.length || 0,
        inTransit: 5,
        totalValue: inventory.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0),
        pendingOrders: 8
      });
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const statCards = [
    {
      title: 'Total Items',
      value: stats.totalItems,
      icon: Package,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
      link: '/inventory'
    },
    {
      title: 'Low Stock',
      value: stats.lowStock,
      icon: TrendingDown,
      bg: 'bg-orange-50',
      color: 'text-orange-600',
      link: '/inventory'
    },
    {
      title: 'Out of Stock',
      value: stats.outOfStock,
      icon: AlertTriangle,
      bg: 'bg-red-50',
      color: 'text-red-600',
      link: '/inventory'
    },
    {
      title: 'In Transit',
      value: stats.inTransit,
      icon: Truck,
      bg: 'bg-purple-50',
      color: 'text-purple-600',
      link: '/purchase-orders'
    },
    {
      title: 'Total Value',
      value: `$${(stats.totalValue / 1000).toFixed(1)}K`,
      icon: BarChart3,
      bg: 'bg-green-50',
      color: 'text-green-600',
      link: '/inventory'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: ShoppingCart,
      bg: 'bg-teal-50',
      color: 'text-teal-600',
      link: '/purchase-orders'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor stock levels and warehouse operations</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/inventory/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Add Item
          </Link>
          <Link
            to="/purchase-orders/new"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            New Order
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <Link key={card.title} to={card.link} className="block">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.bg} p-3 rounded-lg`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Expense Claims and Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseClaimsWidget maxItems={5} />
        <LeaveRequestWidget maxItems={5} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Inventory Alerts
          </h2>
          <div className="space-y-3">
            {stats.outOfStock > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-900">
                  {stats.outOfStock} items out of stock
                </span>
              </div>
            )}
            {stats.lowStock > 0 && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <TrendingDown className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">
                  {stats.lowStock} items low in stock
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/inventory"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Package className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Inventory</p>
            </Link>
            <Link
              to="/purchase-orders"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <ShoppingCart className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">PO</p>
            </Link>
            <Link
              to="/warehouse"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"  
            >
              <Archive className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Warehouse</p>
            </Link>
            <Link
              to="/reports"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <FileText className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Reports</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagerDashboard;
