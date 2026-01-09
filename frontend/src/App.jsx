import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './auth/Login';
import Register from './auth/Register';
import ProtectedRoute from './auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import InviteUser from './pages/InviteUser';
import AcceptInvite from './pages/AcceptInvite';
import { useDashboardStore } from './store/dashboard.store';
import { useInventoryStore } from './store/inventory.store';

// Inventory
import InventoryList from './pages/inventory/InventoryList';
import InventoryDashboard from './pages/inventory/InventoryDashboard';

// Departments
import DepartmentList from './pages/departments/DepartmentList';

// RBAC
import RolesList from './pages/rbac/RolesList';
import PermissionMatrix from './pages/rbac/PermissionMatrix';

// Company
import CompanySettings from './pages/company/CompanySettings';

// Workflows
import WorkflowList from './pages/workflows/WorkflowList';
import ApprovalQueue from './pages/workflows/ApprovalQueue';

// Audit & Reports
import AuditLogs from './pages/audit/AuditLogs';
import ReportsDashboard from './pages/reports/ReportsDashboard';

// System
import SystemOptions from './pages/SystemOptions';

function App() {
  const initializeDashboardRealTime = useDashboardStore(state => state.initializeRealTime);
  const initializeInventoryRealTime = useInventoryStore(state => state.initializeRealTime);
  const disconnectDashboardRealTime = useDashboardStore(state => state.disconnectRealTime);
  const disconnectInventoryRealTime = useInventoryStore(state => state.disconnectRealTime);

  useEffect(() => {
    // Initialize real-time connections when app starts
    const token = localStorage.getItem('token');
    if (token) {
      initializeDashboardRealTime();
      initializeInventoryRealTime();
    }

    // Cleanup on unmount
    return () => {
      disconnectDashboardRealTime();
      disconnectInventoryRealTime();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
  path="/users"
  element={
    <ProtectedRoute>
      <Users />
    </ProtectedRoute>
  }
/>
<Route
  path="/invite"
  element={
    <ProtectedRoute>
      <InviteUser />
    </ProtectedRoute>
  }
/>

<Route path="/accept-invite" element={<AcceptInvite />} />

        {/* Inventory Routes */}
        <Route path="/inventory" element={<ProtectedRoute><InventoryList /></ProtectedRoute>} />
        <Route path="/inventory-dashboard" element={<ProtectedRoute><InventoryDashboard /></ProtectedRoute>} />
        
        {/* Department Routes */}
        <Route path="/departments" element={<ProtectedRoute><DepartmentList /></ProtectedRoute>} />
        
        {/* RBAC Routes */}
        <Route path="/roles" element={<ProtectedRoute><RolesList /></ProtectedRoute>} />
        <Route path="/permissions" element={<ProtectedRoute><PermissionMatrix /></ProtectedRoute>} />
        
        {/* Company Routes */}
        <Route path="/company" element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} />
        
        {/* Workflow Routes */}
        <Route path="/workflows" element={<ProtectedRoute><WorkflowList /></ProtectedRoute>} />
        <Route path="/approvals" element={<ProtectedRoute><ApprovalQueue /></ProtectedRoute>} />
        
        {/* Audit & Reports Routes */}
        <Route path="/audit" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsDashboard /></ProtectedRoute>} />
        
        {/* System Routes */}
        <Route path="/system-options" element={<ProtectedRoute><SystemOptions /></ProtectedRoute>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
