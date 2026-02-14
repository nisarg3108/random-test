import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, TrendingUp, TrendingDown, Truck,
  CheckCircle, AlertCircle, Archive
} from 'lucide-react';
import { apiClient } from '../../api/http';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExpenseClaimsWidget from '../../components/dashboard/ExpenseClaimsWidget';
import LeaveRequestWidget from '../../components/dashboard/LeaveRequestWidget';

const WarehouseStaffDashboard = () => {
  const [stats, setStats] = useState({
    todayReceipts: 0,
    todayDispatch: 0,
    pendingPicks: 0,
    myTasks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Mock data
      setStats({
        todayReceipts: 8,
        todayDispatch: 12,
        pendingPicks: 5,
        myTasks: 3
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
      title: 'Today Receipts',
      value: stats.todayReceipts,
      icon: TrendingUp,
      bg: 'bg-green-50',
      color: 'text-green-600',
      link: '/warehouse/receipts'
    },
    {
      title: 'Today Dispatch',
      value: stats.todayDispatch,
      icon: TrendingDown,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
      link: '/warehouse/dispatch'
    },
    {
      title: 'Pending Picks',
      value: stats.pendingPicks,
      icon: AlertCircle,
      bg: 'bg-orange-50',
      color: 'text-orange-600',
      link: '/warehouse/picks'
    },
    {
      title: 'My Tasks',
      value: stats.myTasks,
      icon: CheckCircle,
      bg: 'bg-purple-50',
      color: 'text-purple-600',
      link: '/tasks'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warehouse Staff Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage daily warehouse operations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            to="/inventory"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <Package className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">View Inventory</p>
          </Link>
          <Link
            to="/warehouse/receipts"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Receipts</p>
          </Link>
          <Link
            to="/warehouse/dispatch"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <Truck className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Dispatch</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WarehouseStaffDashboard;
