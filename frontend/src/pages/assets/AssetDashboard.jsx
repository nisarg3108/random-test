import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, Users, Wrench, DollarSign } from 'lucide-react';
import { assetAPI } from '../../api/asset.api';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AssetDashboard = () => {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const response = await assetAPI.getStatistics();
      setStatistics(response.data);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !statistics) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
    <div
      className={`bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Asset Management Dashboard</h1>
          </div>
          <button
            onClick={() => navigate('/assets/list')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            View All Assets
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Assets"
            value={statistics.totalAssets}
            icon={Package}
            color="bg-blue-500"
            onClick={() => navigate('/assets/list')}
          />
          <StatCard
            title="Available"
            value={statistics.availableAssets}
            icon={TrendingUp}
            color="bg-green-500"
          />
          <StatCard
            title="Allocated"
            value={statistics.allocatedAssets}
            icon={Users}
            color="bg-purple-500"
            onClick={() => navigate('/assets/allocations')}
          />
          <StatCard
            title="In Maintenance"
            value={statistics.maintenanceAssets}
            icon={Wrench}
            color="bg-yellow-500"
            onClick={() => navigate('/assets/maintenance')}
          />
        </div>

        {/* Value Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Asset Value</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Purchase Value:</span>
                <span className="text-xl font-bold text-gray-900">
                  ${statistics.totalPurchaseValue?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Value:</span>
                <span className="text-xl font-bold text-green-600">
                  ${statistics.totalCurrentValue?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-gray-600">Total Depreciation:</span>
                <span className="text-xl font-bold text-red-600">
                  ${(statistics.totalPurchaseValue - statistics.totalCurrentValue)?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assets by Category</h2>
            <div className="space-y-3">
              {statistics.categoryBreakdown?.map((category) => (
                <div key={category.categoryId} className="flex justify-between items-center">
                  <span className="text-gray-700">{category.categoryName}</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {category.count}
                  </span>
                </div>
              ))}
              {statistics.categoryBreakdown?.length === 0 && (
                <p className="text-gray-500 text-center py-4">No categories available</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/assets/new')}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Add New Asset
            </button>
            <button
              onClick={() => navigate('/assets/allocations')}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              Allocate Asset
            </button>
            <button
              onClick={() => navigate('/assets/maintenance')}
              className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
            >
              Schedule Maintenance
            </button>
            <button
              onClick={() => navigate('/assets/depreciation')}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Calculate Depreciation
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AssetDashboard;
