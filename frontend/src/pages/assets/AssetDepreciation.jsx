import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { TrendingDown, DollarSign, Calendar, BarChart3, Package } from 'lucide-react';
import { apiClient } from '../../api/http';

const AssetDepreciation = () => {
  const [depreciations, setDepreciations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalDepreciation: 0,
    currentValue: 0,
    originalValue: 0
  });

  useEffect(() => {
    fetchDepreciationData();
  }, []);

  const fetchDepreciationData = async () => {
    try {
      const response = await apiClient.get('/asset-depreciation');
      const data = response.data.data || [];
      setDepreciations(data);

      // Calculate stats
      const totalDep = data.reduce((sum, d) => sum + (d.depreciatedValue || 0), 0);
      const totalOriginal = data.reduce((sum, d) => sum + (d.asset?.purchasePrice || 0), 0);
      
      setStats({
        totalAssets: data.length,
        totalDepreciation: totalDep,
        currentValue: totalOriginal - totalDep,
        originalValue: totalOriginal
      });
    } catch (error) {
      console.error('Error fetching depreciation data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Asset Depreciation</h1>
          <p className="text-gray-600 mt-2">Track asset value depreciation over time</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Assets</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{stats.totalAssets}</p>
              </div>
              <Package className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Original Value</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  ${stats.originalValue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Depreciation</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  ${stats.totalDepreciation.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Current Value</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  ${stats.currentValue.toLocaleString()}
                </p>
              </div>
              <BarChart3 className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Depreciation Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Depreciation Schedule</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Depreciated Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Useful Life
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Depreciation %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {depreciations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No depreciation records found
                    </td>
                  </tr>
                ) : (
                  depreciations.map((record) => {
                    const purchasePrice = record.asset?.purchasePrice || 0;
                    const depValue = record.depreciatedValue || 0;
                    const currentValue = purchasePrice - depValue;
                    const depPercent = purchasePrice > 0 ? ((depValue / purchasePrice) * 100).toFixed(2) : 0;

                    return (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {record.asset?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.asset?.code || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {record.method || 'STRAIGHT_LINE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${purchasePrice.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                          -${depValue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          ${currentValue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.usefulLife || 'N/A'} years
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-red-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(depPercent, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="ml-2 text-sm text-gray-900">{depPercent}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Depreciation Methods Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">Depreciation Methods</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold text-blue-800">Straight Line</h4>
              <p className="text-sm text-blue-700">Equal depreciation each year over useful life</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800">Declining Balance</h4>
              <p className="text-sm text-blue-700">Higher depreciation in early years</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800">Units of Production</h4>
              <p className="text-sm text-blue-700">Based on usage or output</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AssetDepreciation;
