import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, ArrowUpRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { hrAPI } from '../../api/hr.api';

const LeaveRequestWidget = ({ maxItems = 5 }) => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    try {
      const response = await hrAPI.getLeaveRequests();
      setLeaveRequests(response.data.slice(0, maxItems));
    } catch (error) {
      if (error.message?.includes('Access denied') || error.message?.includes('403')) {
        console.log('No permission to view leave requests');
      } else {
        console.error('Failed to load leave requests:', error);
      }
      setLeaveRequests([]);
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

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Leave Requests</h2>
            <p className="text-gray-500 text-sm">Your leave history</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link 
            to="/hr/leave-requests" 
            className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 font-semibold text-sm rounded-xl transition-all duration-200 hover:scale-105"
          >
            <span>View All</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : leaveRequests.length > 0 ? (
        <div className="space-y-4">
          {leaveRequests.map((request) => (
            <div key={request.id} className="group flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all duration-200 border border-transparent hover:border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">
                    {request.leaveType?.name || 'Leave Request'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900 mb-2">
                  {calculateDays(request.startDate, request.endDate)} day{calculateDays(request.startDate, request.endDate) > 1 ? 's' : ''}
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(request.status)}`}>
                  {getStatusIcon(request.status)}
                  <span>{request.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium mb-2">No leave requests</p>
          <p className="text-gray-400 text-sm mb-4">Apply for your first leave</p>
          <Link 
            to="/hr/leave-requests" 
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Apply Leave</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestWidget;
