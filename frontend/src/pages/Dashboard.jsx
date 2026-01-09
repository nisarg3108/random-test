import React from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import UserDashboard from './dashboards/UserDashboard';
import ManagerDashboard from './dashboards/ManagerDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
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
