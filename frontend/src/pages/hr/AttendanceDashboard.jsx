import React, { useState, useEffect } from 'react';
import {
  Clock, Users, TrendingUp, AlertCircle, CheckCircle, Calendar, Briefcase
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ClockInOut from './ClockInOut';
import AttendanceReports from './AttendanceReports';
import ShiftManagement from './ShiftManagement';
import OvertimeTracking from './OvertimeTracking';
import { apiClient } from '../../api/http';

const AttendanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('clock-in');
  const [employee, setEmployee] = useState(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    clockedIn: 0,
    averageAttendance: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch current employee data and attendance stats
      const empRes = await apiClient.get('/employees/me');
      setEmployee(empRes.data?.data);

      // Fetch dashboard stats (you'd implement this endpoint)
      // For now, we'll use mock data
      setStats({
        totalEmployees: 150,
        presentToday: 142,
        absentToday: 8,
        clockedIn: 138,
        averageAttendance: 94.5
      });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'clock-in', label: 'Clock In/Out', icon: Clock },
    { id: 'shifts', label: 'Shift Management', icon: Briefcase },
    { id: 'overtime', label: 'Overtime Tracking', icon: TrendingUp },
    { id: 'reports', label: 'Attendance Reports', icon: Calendar }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Attendance & Time Tracking</h1>
            <p className="text-gray-600 mt-1">Manage your attendance, shifts, and work hours</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Employees</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalEmployees}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Present Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.presentToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Absent Today</p>
                <p className="text-2xl font-bold text-red-600">{stats.absentToday}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Clocked In</p>
                <p className="text-2xl font-bold text-blue-600">{stats.clockedIn}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Avg Attendance</p>
                <p className="text-2xl font-bold text-purple-600">{stats.averageAttendance}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'clock-in' && employee && (
              <ClockInOut employeeId={employee.id} />
            )}

            {activeTab === 'shifts' && employee && (
              <ShiftManagement employeeId={employee.id} />
            )}

            {activeTab === 'overtime' && employee && (
              <OvertimeTracking employeeId={employee.id} />
            )}

            {activeTab === 'reports' && employee && (
              <AttendanceReports employeeId={employee.id} departmentId={employee.departmentId} />
            )}
          </div>
        </div>

        {/* Quick Info Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <ul className="space-y-2">
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span><strong>Clock In/Out:</strong> Record your work hours by clicking the Clock In button when you arrive and Clock Out when you leave.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span><strong>Shift Management:</strong> View and manage your assigned shifts and shift changes.</span>
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span><strong>Overtime Tracking:</strong> Monitor and request overtime hours with proper approval.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span><strong>Reports:</strong> Generate and download your monthly attendance reports.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceDashboard;
