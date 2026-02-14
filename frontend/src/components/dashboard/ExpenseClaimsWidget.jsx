import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Plus, ArrowUpRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getExpenseClaims } from '../../api/finance.api';

const ExpenseClaimsWidget = ({ maxItems = 5 }) => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      const data = await getExpenseClaims();
      setClaims(data.slice(0, maxItems));
    } catch (error) {
      if (error.message?.includes('Access denied') || error.message?.includes('403')) {
        console.log('No permission to view expense claims');
      } else {
        console.error('Failed to load expense claims:', error);
      }
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'REJECTED': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-amber-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Expense Claims</h2>
            <p className="text-gray-500 text-sm">Your recent claims</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link 
            to="/finance/expense-claims" 
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 font-semibold text-sm rounded-xl transition-all duration-200 hover:scale-105"
          >
            <span>View All</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
        </div>
      ) : claims.length > 0 ? (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div key={claim.id} className="group flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all duration-200 border border-transparent hover:border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">{claim.description || 'Expense Claim'}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(claim.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900 mb-2">₹{claim.amount}</div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(claim.status)}`}>
                  {getStatusIcon(claim.status)}
                  <span>{claim.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium mb-2">No expense claims</p>
          <p className="text-gray-400 text-sm mb-4">Submit your first expense claim</p>
          <Link 
            to="/finance/expense-claims" 
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>New Claim</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ExpenseClaimsWidget;
