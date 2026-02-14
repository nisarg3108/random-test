import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, Users, TrendingUp, DollarSign,
  Package, FileText, AlertCircle, CheckCircle
} from 'lucide-react';
import { apiClient } from '../../api/http';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ApprovalWidget from '../../components/approvals/ApprovalWidget';
import ExpenseClaimsWidget from '../../components/dashboard/ExpenseClaimsWidget';
import LeaveRequestWidget from '../../components/dashboard/LeaveRequestWidget';

const PurchaseManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingApprovals: 0,
    activeVendors: 0,
    monthlySpend: 0,
    ordersInTransit: 0,
    receivedToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Mock purchase data
      setStats({
        totalOrders: 45,
        pendingApprovals: 8,
        activeVendors: 28,
        monthlySpend: 185000,
        ordersInTransit: 12,
        receivedToday: 5
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
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
      link: '/purchase-orders'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: AlertCircle,
      bg: 'bg-orange-50',
      color: 'text-orange-600',
      link: '/approvals'
    },
    {
      title: 'Active Vendors',
      value: stats.activeVendors,
      icon: Users,
      bg: 'bg-purple-50',
      color: 'text-purple-600',
      link: '/vendors'
    },
    {
      title: 'Monthly Spend',
      value: `$${(stats.monthlySpend / 1000).toFixed(0)}K`,
      icon: DollarSign,
      bg: 'bg-green-50',
      color: 'text-green-600',
      link: '/reports'
    },
    {
      title: 'In Transit',
      value: stats.ordersInTransit,
      icon: Package,
      bg: 'bg-teal-50',
      color: 'text-teal-600',
      link: '/purchase-orders'
    },
    {
      title: 'Received Today',
      value: stats.receivedToday,
      icon: CheckCircle,
      bg: 'bg-indigo-50',
      color: 'text-indigo-600',
      link: '/purchase-orders'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage procurement and vendor relations</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/vendors/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Add Vendor
          </Link>
          <Link
            to="/purchase-orders/new"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            New PO
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
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Pending Approvals
          </h2>
          <ApprovalWidget userRole="PURCHASE_MANAGER" />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/purchase-orders"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <ShoppingCart className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">PO List</p>
            </Link>
            <Link
              to="/vendors"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Vendors</p>
            </Link>
            <Link
              to="/inventory"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <Package className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Inventory</p>
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

export default PurchaseManagerDashboard;
