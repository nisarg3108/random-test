import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Package, User, ArrowRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { assetAPI } from '../../api/asset.api';

const OverdueAllocationWidget = ({ maxItems = 5, showDetails = true }) => {
  const navigate = useNavigate();
  const [overdueAllocations, setOverdueAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOverdueAllocations();
  }, []);

  const loadOverdueAllocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await assetAPI.getOverdueAllocations();
      setOverdueAllocations(response.data || []);
    } catch (err) {
      setError('Failed to load overdue allocations');
      console.error('Error loading overdue allocations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOverdueAllocations();
  };

  const calculateDaysOverdue = (expectedReturnDate) => {
    const today = new Date();
    const returnDate = new Date(expectedReturnDate);
    const diffTime = today - returnDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="modern-card-elevated p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const limitedItems = overdueAllocations.slice(0, maxItems);
  const hasMore = overdueAllocations.length > maxItems;

  return (
    <div className="modern-card-elevated">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Overdue Allocations
              </h3>
              <p className="text-sm text-gray-500">Assets past return date</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-600 mb-1">Total Overdue</p>
                <p className="text-2xl font-bold text-red-700">
                  {overdueAllocations.length}
                </p>
              </div>
              <Package className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-600 mb-1">Avg Days</p>
                <p className="text-2xl font-bold text-orange-700">
                  {overdueAllocations.length > 0
                    ? Math.round(
                        overdueAllocations.reduce(
                          (sum, a) => sum + calculateDaysOverdue(a.expectedReturnDate),
                          0
                        ) / overdueAllocations.length
                      )
                    : 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Items List */}
      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {overdueAllocations.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">All Clear!</h4>
            <p className="text-sm text-gray-500">No overdue allocations at the moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {limitedItems.map((allocation) => {
              const daysOverdue = calculateDaysOverdue(allocation.expectedReturnDate);
              const severityColor = daysOverdue > 7 ? 'red' : daysOverdue > 3 ? 'orange' : 'yellow';

              return (
                <div
                  key={allocation.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate('/assets/allocations')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Asset Info */}
                      <div className="flex items-center space-x-2 mb-2">
                        <Package className="w-4 h-4 text-gray-600" />
                        <h4 className="font-medium text-gray-900">
                          {allocation.asset?.name || 'Unknown Asset'}
                        </h4>
                      </div>

                      {/* Asset Code */}
                      <p className="text-xs text-gray-500 mb-2">
                        Code: {allocation.asset?.assetCode || 'N/A'}
                      </p>

                      {showDetails && (
                        <>
                          {/* Employee Info */}
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">
                              {allocation.employee?.name || 'Unknown Employee'}
                            </span>
                          </div>

                          {/* Dates */}
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>Expected: {formatDate(allocation.expectedReturnDate)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Days Overdue Badge */}
                    <div className={`px-3 py-1.5 rounded-full bg-${severityColor}-100 flex flex-col items-center justify-center`}>
                      <span className={`text-lg font-bold text-${severityColor}-700`}>
                        {daysOverdue}
                      </span>
                      <span className={`text-xs font-medium text-${severityColor}-600`}>
                        {daysOverdue === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  </div>

                  {allocation.purpose && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-600 italic">
                        Purpose: {allocation.purpose}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* View All Button */}
        {overdueAllocations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => navigate('/assets/allocations')}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <span>View All Overdue Allocations</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {hasMore && (
              <p className="text-center text-xs text-gray-500 mt-2">
                {overdueAllocations.length - maxItems} more overdue allocation{overdueAllocations.length - maxItems !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverdueAllocationWidget;
