import React from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import UserDashboard from './dashboards/UserDashboard';
import ManagerDashboard from './dashboards/ManagerDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

const Dashboard = () => {
  const { user, loading } = useAuth();

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-600">Loading user data...</p>
          </div>
        </div>
      );
    }

    switch (user.role) {
      case 'ADMIN':
        return <AdminDashboard />;
      case 'MANAGER':
        return <ManagerDashboard />;
      case 'USER':
      default:
        return <UserDashboard />;
    }
  };

  return (
    <Layout>
      {renderDashboard()}
    </Layout>
  );
};

export default Dashboard;
