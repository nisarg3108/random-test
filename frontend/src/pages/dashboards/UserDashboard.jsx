import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInventoryStore } from '../../store/inventory.store';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExpenseClaimsWidget from '../../components/dashboard/ExpenseClaimsWidget';
import LeaveRequestWidget from '../../components/dashboard/LeaveRequestWidget';
import { Package, DollarSign, AlertTriangle, Plus, Eye, TrendingUp, Sparkles, BarChart3 } from 'lucide-react';

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
    <div className="space-y-8 animate-fade-in">
      {/* Modern Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 rounded-2xl p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Welcome Back!</h1>
              <p className="text-emerald-100 text-lg">Here's your inventory overview</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 rounded-2xl bg-blue-50 group-hover:scale-110 transition-transform duration-300">
                <Package className="w-7 h-7 text-blue-600" />
              </div>
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                <TrendingUp className="w-3 h-3" />
                <span>+5%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Items</p>
              <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{items.length}</p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 rounded-2xl bg-emerald-50 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                <TrendingUp className="w-3 h-3" />
                <span>+12%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Value</p>
              <p className="text-3xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors duration-300">₹{totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 rounded-2xl bg-amber-50 group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3 h-3" />
                <span>Alert</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Low Stock</p>
              <p className="text-3xl font-bold text-gray-900 group-hover:text-amber-600 transition-colors duration-300">{lowStockItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            <p className="text-gray-500 text-sm">Manage your inventory efficiently</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Link to="/inventory" className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <Eye className="w-7 h-7 text-blue-600" />
              </div>
              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">View Inventory</div>
            </div>
          </Link>
          <Link to="/inventory" className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <Plus className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors duration-300">Add Item</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Expense Claims and Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ExpenseClaimsWidget maxItems={5} />
        <LeaveRequestWidget maxItems={5} />
      </div>

      {/* Enhanced Recent Items */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recent Items</h2>
            <p className="text-gray-500 text-sm">Latest inventory additions</p>
          </div>
        </div>
        {recentItems.length > 0 ? (
          <div className="space-y-4">
            {recentItems.map((item) => (
              <div key={item.id} className="group flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all duration-200 border border-transparent hover:border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Package className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">{item.name}</p>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-gray-900">₹{item.price}</span>
                    <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg">
                      Qty: {item.quantity}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No items found</p>
            <p className="text-gray-400 text-sm mt-1">Start by adding your first inventory item</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;