import React, { useState } from 'react';
import { Clock, Users, Calendar, BarChart3 } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import ClockInOut from './ClockInOut';
import ShiftManagement from './ShiftManagement';
import OvertimeTracking from './OvertimeTracking';
import AttendanceReports from './AttendanceReports';

export default function AttendanceDashboard() {
  const [activeTab, setActiveTab] = useState('clock');

  const tabs = [
    { id: 'clock', label: 'Clock In/Out', icon: Clock, component: ClockInOut },
    { id: 'shifts', label: 'Shift Management', icon: Calendar, component: ShiftManagement },
    { id: 'overtime', label: 'Overtime', icon: Users, component: OvertimeTracking },
    { id: 'reports', label: 'Reports', icon: BarChart3, component: AttendanceReports }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-primary-900 flex items-center">
            <Clock className="w-8 h-8 mr-3 text-blue-600" />
            Attendance & Time Tracking
          </h1>
          <p className="text-primary-600 mt-1">
            Manage employee attendance, shifts, and overtime
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-primary-200">
          <div className="border-b border-primary-200">
            <nav className="flex space-x-1 p-2" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'text-primary-600 hover:bg-primary-50 hover:text-primary-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {ActiveComponent && <ActiveComponent />}
          </div>
        </div>
      </div>
    </Layout>
  );
}
