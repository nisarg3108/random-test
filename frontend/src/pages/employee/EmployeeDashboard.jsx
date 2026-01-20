import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, FileText, User, AlertCircle } from 'lucide-react';

const EmployeeDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/employee/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      
      const data = await response.json();
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!dashboard) return <div className="p-6">No data available</div>;

  const { employee, stats, leaveRequests, expenseClaims, leaveBalance } = dashboard;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
        <p className="text-gray-600">Welcome back, {employee.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Leave Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingLeaveRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Expenses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingExpenseClaims}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved Leaves</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedLeaveRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalExpenseAmount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Leave Requests */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Recent Leave Requests</h2>
          </div>
          <div className="p-6">
            {leaveRequests.length === 0 ? (
              <p className="text-gray-500">No leave requests found</p>
            ) : (
              <div className="space-y-4">
                {leaveRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{request.leaveType.name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Expense Claims */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Recent Expense Claims</h2>
          </div>
          <div className="p-6">
            {expenseClaims.length === 0 ? (
              <p className="text-gray-500">No expense claims found</p>
            ) : (
              <div className="space-y-4">
                {expenseClaims.slice(0, 5).map((claim) => (
                  <div key={claim.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{claim.category.name}</p>
                      <p className="text-sm text-gray-600">{claim.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${claim.amount}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        claim.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        claim.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {claim.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leave Balance */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Leave Balance</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {leaveBalance.map((balance, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">{balance.leaveType}</h3>
                <div className="mt-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Used: {balance.usedDays}</span>
                    <span>Remaining: {balance.remainingDays}</span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(balance.usedDays / balance.maxDays) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Total: {balance.maxDays} days</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;