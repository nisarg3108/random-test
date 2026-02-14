import React from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import UserDashboard from './dashboards/UserDashboard';
import ManagerDashboard from './dashboards/ManagerDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import HRManagerDashboard from './dashboards/HRManagerDashboard';
import HRStaffDashboard from './dashboards/HRStaffDashboard';
import FinanceManagerDashboard from './dashboards/FinanceManagerDashboard';
import AccountantDashboard from './dashboards/AccountantDashboard';
import InventoryManagerDashboard from './dashboards/InventoryManagerDashboard';
import WarehouseStaffDashboard from './dashboards/WarehouseStaffDashboard';
import SalesManagerDashboard from './dashboards/SalesManagerDashboard';
import SalesStaffDashboard from './dashboards/SalesStaffDashboard';
import PurchaseManagerDashboard from './dashboards/PurchaseManagerDashboard';
import ProjectManagerDashboard from './dashboards/ProjectManagerDashboard';
import EmployeeDashboard from './dashboards/EmployeeDashboard';

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

    // Role-to-Dashboard mapping
    const dashboardMap = {
      ADMIN: AdminDashboard,
      MANAGER: ManagerDashboard,
      HR_MANAGER: HRManagerDashboard,
      HR_STAFF: HRStaffDashboard,
      FINANCE_MANAGER: FinanceManagerDashboard,
      ACCOUNTANT: AccountantDashboard,
      INVENTORY_MANAGER: InventoryManagerDashboard,
      WAREHOUSE_STAFF: WarehouseStaffDashboard,
      SALES_MANAGER: SalesManagerDashboard,
      SALES_STAFF: SalesStaffDashboard,
      PURCHASE_MANAGER: PurchaseManagerDashboard,
      PROJECT_MANAGER: ProjectManagerDashboard,
      EMPLOYEE: EmployeeDashboard,
      USER: UserDashboard
    };

    const DashboardComponent = dashboardMap[user.role] || UserDashboard;
    return <DashboardComponent />;
  };

  return (
    <Layout>
      {renderDashboard()}
    </Layout>
  );
};

export default Dashboard;
