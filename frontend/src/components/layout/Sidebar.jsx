import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, Package, Building2, Users, Mail, Shield, 
  ShieldCheck, Zap, CheckCircle, FileText, Settings, 
  BarChart3, ChevronLeft, ChevronRight, LogOut, Menu, 
  User, Crown, Zap as ZapIcon, UserCheck, Calendar, DollarSign, Truck,
  ClipboardList, Target, Briefcase, ShoppingCart, Box, Clock, 
  TrendingDown, Wrench, Bell, MessageSquare, Megaphone, Hash
} from 'lucide-react';
import { removeToken } from '../../store/auth.store';

const Sidebar = () => {
  const location = useLocation();
  const { user, hasRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, minRole: 'USER' },
    { path: '/inventory', label: 'Inventory', icon: Package, minRole: 'USER' },
    { path: '/inventory-dashboard', label: 'Analytics', icon: BarChart3, minRole: 'USER' },
    { path: '/hr', label: 'HR Dashboard', icon: UserCheck, minRole: 'MANAGER' },
    { path: '/hr/employees', label: 'Employees', icon: Users, minRole: 'MANAGER' },
    { path: '/hr/salary-management', label: 'Salary Management', icon: DollarSign, minRole: 'MANAGER' },
    { path: '/hr/leave-requests', label: 'Leave Requests', icon: Calendar, minRole: 'USER' },
    { path: '/hr/leave-types', label: 'Leave Types', icon: Calendar, minRole: 'MANAGER' },
    { path: '/hr/payroll', label: 'Payroll Dashboard', icon: DollarSign, minRole: 'MANAGER' },
    { path: '/hr/payroll/cycles', label: 'Payroll Cycles', icon: Calendar, minRole: 'MANAGER' },
    { path: '/hr/attendance', label: 'Attendance Dashboard', icon: Clock, minRole: 'MANAGER' },
    { path: '/hr/attendance/clock', label: 'Clock In/Out', icon: Clock, minRole: 'USER' },
    { path: '/hr/attendance/reports', label: 'Attendance Reports', icon: FileText, minRole: 'MANAGER' },
    { path: '/hr/shifts', label: 'Shift Management', icon: Calendar, minRole: 'MANAGER' },
    { path: '/hr/overtime', label: 'Overtime Tracking', icon: Clock, minRole: 'MANAGER' },
    { path: '/employee/dashboard', label: 'My Dashboard', icon: User, minRole: 'EMPLOYEE', roles: ['EMPLOYEE'] },
    { path: '/employee/tasks', label: 'Task Management', icon: Target, minRole: 'MANAGER' },
    { path: '/employee/work-reports', label: 'Work Reports', icon: ClipboardList, minRole: 'EMPLOYEE', roles: ['EMPLOYEE'] },
    { path: '/finance', label: 'Finance Dashboard', icon: DollarSign, minRole: 'MANAGER' },
    { path: '/finance/expense-categories', label: 'Expense Categories', icon: FileText, minRole: 'MANAGER' },
    { path: '/finance/expense-claims', label: 'Expense Claims', icon: DollarSign, minRole: 'USER' },
    { path: '/finance/approvals', label: 'Finance Approvals', icon: CheckCircle, minRole: 'MANAGER' },
    { path: '/crm', label: 'CRM Dashboard', icon: Briefcase, minRole: 'USER' },
    { path: '/crm/customers', label: 'CRM Customers', icon: Users, minRole: 'USER' },
    { path: '/crm/contacts', label: 'CRM Contacts', icon: User, minRole: 'USER' },
    { path: '/crm/leads', label: 'CRM Leads', icon: Target, minRole: 'USER' },
    { path: '/crm/pipeline', label: 'Sales Pipeline', icon: Briefcase, minRole: 'MANAGER' },
    { path: '/crm/communications', label: 'Communication History', icon: FileText, minRole: 'USER' },
    { path: '/sales/quotations', label: 'Quotations', icon: FileText, minRole: 'USER' },
    { path: '/sales/orders', label: 'Sales Orders', icon: Package, minRole: 'USER' },
    { path: '/sales/invoices', label: 'Invoicing', icon: DollarSign, minRole: 'USER' },
    { path: '/sales/tracking', label: 'Order Tracking', icon: Truck, minRole: 'USER' },
    { path: '/sales/analytics', label: 'Sales Analytics', icon: BarChart3, minRole: 'USER' },
    { path: '/purchase/vendors', label: 'Vendors', icon: Users, minRole: 'USER' },
    { path: '/purchase/requisitions', label: 'Purchase Requisitions', icon: FileText, minRole: 'USER' },
    { path: '/purchase/orders', label: 'Purchase Orders', icon: ShoppingCart, minRole: 'USER' },
    { path: '/purchase/evaluations', label: 'Supplier Evaluation', icon: CheckCircle, minRole: 'MANAGER' },
    { path: '/purchase/analytics', label: 'Purchase Analytics', icon: BarChart3, minRole: 'USER' },
    { path: '/projects', label: 'Projects', icon: Briefcase, minRole: 'USER' },
    { path: '/assets', label: 'Asset Management', icon: Box, minRole: 'USER' },
    { path: '/assets/list', label: 'Assets List', icon: Package, minRole: 'USER' },
    { path: '/assets/allocations', label: 'Asset Allocations', icon: Users, minRole: 'USER' },
    { path: '/assets/maintenance', label: 'Asset Maintenance', icon: Wrench, minRole: 'USER' },
    { path: '/assets/depreciation', label: 'Asset Depreciation', icon: TrendingDown, minRole: 'USER' },
    { path: '/documents', label: 'Documents', icon: FileText, minRole: 'USER' },
    { path: '/communication/messages', label: 'Messages', icon: MessageSquare, minRole: 'USER' },
    { path: '/communication/announcements', label: 'Announcements', icon: Megaphone, minRole: 'USER' },
    { path: '/communication/channels', label: 'Channels', icon: Hash, minRole: 'USER' },
    { path: '/notifications', label: 'Notifications', icon: Bell, minRole: 'USER' },
    { path: '/departments', label: 'Departments', icon: Building2, minRole: 'USER' },
    { path: '/users', label: 'Users', icon: Users, minRole: 'MANAGER' },
    { path: '/invite', label: 'Invite Users', icon: Mail, minRole: 'MANAGER' },
    { path: '/roles', label: 'Roles', icon: Shield, minRole: 'ADMIN' },
    { path: '/permissions', label: 'Permissions', icon: ShieldCheck, minRole: 'ADMIN' },
    { path: '/workflows', label: 'Workflows', icon: Zap, minRole: 'USER' },
    { path: '/approvals', label: 'Approvals', icon: CheckCircle, minRole: 'USER' },
    { path: '/approval-dashboard', label: 'Approval Center', icon: CheckCircle, minRole: 'USER' },
    { path: '/audit', label: 'Audit Logs', icon: FileText, minRole: 'MANAGER' },
    { path: '/company', label: 'Company', icon: Settings, minRole: 'ADMIN' },
    { path: '/system-options', label: 'System', icon: Settings, minRole: 'ADMIN' },
    { path: '/reports', label: 'Reports', icon: BarChart3, minRole: 'USER' }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    // If item has specific roles, check if user has one of those roles
    if (item.roles) {
      return item.roles.includes(user.role);
    }
    // Otherwise, check minimum role requirement
    return hasRole(item.minRole);
  });

  const handleLogout = () => {
    removeToken();
    window.location.href = '/';
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'ADMIN': { color: 'bg-gradient-to-r from-red-500 to-pink-500 text-white', icon: Crown },
      'MANAGER': { color: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white', icon: ZapIcon },
      'USER': { color: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white', icon: User }
    };
    const config = roleConfig[role] || roleConfig['USER'];
    const IconComponent = config.icon;
    
    return (
      <div className={`${config.color} px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 shadow-sm`}>
        <IconComponent className="w-3 h-3" />
        {!collapsed && <span>{role}</span>}
      </div>
    );
  };

  return (
    <div className={`bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 min-h-screen transition-all duration-300 shadow-2xl ${
      collapsed ? 'w-16' : 'w-72'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="animate-fade-in">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Menu className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">UEORMS</h2>
                  <p className="text-xs text-slate-400">Enterprise Suite</p>
                </div>
              </div>
              <div className="flex justify-center">
                {getRoleBadge(user.role)}
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-xl hover:bg-slate-700/50 transition-all duration-200 hover:scale-105"
          >
            {collapsed ? 
              <ChevronRight className="w-5 h-5 text-slate-400" /> : 
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            }
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-lg border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white hover:scale-105'
              }`}
              title={collapsed ? item.label : ''}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-full" />
              )}
              <Icon className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-4'} transition-transform group-hover:scale-110`} />
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
              {!collapsed && isActive && (
                <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
        {!collapsed && (
          <div className="mb-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.email?.split('@')[0]}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
                <p className="text-xs text-slate-500">ID: {user.id}</p>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={`group flex items-center w-full px-4 py-3 text-slate-300 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all duration-200 hover:scale-105 ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Logout' : ''}
        >
          <LogOut className={`w-5 h-5 ${collapsed ? '' : 'mr-3'} transition-transform group-hover:scale-110`} />
          {!collapsed && <span className="font-medium text-sm">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;