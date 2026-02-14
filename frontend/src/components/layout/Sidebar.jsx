import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, Package, Building2, Users, Mail, Shield, 
  ShieldCheck, Zap, CheckCircle, FileText, Settings, 
  BarChart3, ChevronLeft, ChevronRight, LogOut, Menu, 
  User, Crown, Zap as ZapIcon, UserCheck, Calendar, DollarSign, Truck,
  ClipboardList, Target, Briefcase, ShoppingCart, Box, 
  TrendingDown, Wrench, Bell, MessageSquare, Megaphone, Hash, Clock
} from 'lucide-react';
import { removeToken } from '../../store/auth.store';

const Sidebar = () => {
  const location = useLocation();
  const { user, hasRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  // Define menu items with specific role access
  const getMenuItems = () => {
    const role = user.role;
    const items = [];

    // Dashboard - Everyone
    items.push({ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard });

    // HR Manager specific items
    if (['ADMIN', 'HR_MANAGER'].includes(role)) {
      items.push(
        { path: '/hr', label: 'HR Dashboard', icon: UserCheck },
        { path: '/hr/employees', label: 'Employees', icon: Users },
        { path: '/hr/salary-management', label: 'Salary Management', icon: DollarSign },
        { path: '/hr/leave-types', label: 'Leave Types', icon: Calendar },
        { path: '/hr/payroll', label: 'Payroll Dashboard', icon: DollarSign },
        { path: '/hr/payroll/cycles', label: 'Payroll Cycles', icon: Calendar },
        { path: '/hr/approvals', label: 'Leave Approvals', icon: CheckCircle }
      );
    }

    // HR Staff specific items
    if (['ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(role)) {
      items.push(
        { path: '/hr/employees', label: 'Employees', icon: Users },
        { path: '/hr/attendance', label: 'Attendance', icon: Clock },
        { path: '/hr/leave-requests', label: 'Leave Requests', icon: Calendar },
        { path: '/hr/approvals', label: 'Leave Approvals', icon: CheckCircle }
      );
    }

    // Employee self-service
    if (role === 'EMPLOYEE') {
      items.push(
        { path: '/hr/attendance', label: 'My Attendance', icon: Clock },
        { path: '/hr/leave-requests', label: 'My Leaves', icon: Calendar },
        { path: '/employee/tasks', label: 'My Tasks', icon: Target },
        { path: '/employee/work-reports', label: 'Work Reports', icon: ClipboardList },
        { path: '/communication/messages', label: 'Messages', icon: MessageSquare },
        { path: '/notifications', label: 'Notifications', icon: Bell }
      );
    }

    // Finance Manager specific items
    if (['ADMIN', 'FINANCE_MANAGER'].includes(role)) {
      items.push(
        { path: '/finance', label: 'Finance Dashboard', icon: DollarSign },
        { path: '/finance/expense-categories', label: 'Expense Categories', icon: FileText },
        { path: '/finance/approvals', label: 'Finance Approvals', icon: CheckCircle },
        { path: '/accounting/ledger', label: 'General Ledger', icon: FileText },
        { path: '/accounting/reports', label: 'Financial Reports', icon: BarChart3 }
      );
    }

    // Accountant specific items
    if (['ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT'].includes(role)) {
      items.push(
        { path: '/accounting/journal', label: 'Journal Entries', icon: FileText },
        { path: '/accounting/ledger', label: 'Ledger', icon: FileText },
        { path: '/accounting/charts', label: 'Chart of Accounts', icon: FileText }
      );
    }

    // Inventory Manager specific items
    if (['ADMIN', 'INVENTORY_MANAGER'].includes(role)) {
      items.push(
        { path: '/inventory', label: 'Inventory', icon: Package },
        { path: '/inventory-dashboard', label: 'Inventory Analytics', icon: BarChart3 },
        { path: '/warehouse', label: 'Warehouse', icon: Box },
        { path: '/purchase/orders', label: 'Purchase Orders', icon: ShoppingCart }
      );
    }

    // Warehouse Staff specific items
    if (['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'].includes(role)) {
      items.push(
        { path: '/inventory', label: 'Inventory', icon: Package },
        { path: '/warehouse/receipts', label: 'Receipts', icon: Package },
        { path: '/warehouse/dispatch', label: 'Dispatch', icon: Truck }
      );
    }

    // Sales Manager specific items
    if (['ADMIN', 'SALES_MANAGER'].includes(role)) {
      items.push(
        { path: '/crm', label: 'CRM Dashboard', icon: Briefcase },
        { path: '/crm/pipeline', label: 'Sales Pipeline', icon: Target },
        { path: '/crm/customers', label: 'Customers', icon: Users },
        { path: '/sales/analytics', label: 'Sales Analytics', icon: BarChart3 },
        { path: '/sales/orders', label: 'Sales Orders', icon: Package }
      );
    }

    // Sales Staff specific items
    if (['ADMIN', 'SALES_MANAGER', 'SALES_STAFF'].includes(role)) {
      items.push(
        { path: '/crm/leads', label: 'My Leads', icon: Target },
        { path: '/crm/customers', label: 'Customers', icon: Users },
        { path: '/crm/contacts', label: 'Contacts', icon: User },
        { path: '/sales/orders', label: 'Sales Orders', icon: Package },
        { path: '/sales/quotations', label: 'Quotations', icon: FileText }
      );
    }

    // Purchase Manager specific items
    if (['ADMIN', 'PURCHASE_MANAGER'].includes(role)) {
      items.push(
        { path: '/purchase/vendors', label: 'Vendors', icon: Users },
        { path: '/purchase/orders', label: 'Purchase Orders', icon: ShoppingCart },
        { path: '/purchase/requisitions', label: 'Requisitions', icon: FileText },
        { path: '/purchase/analytics', label: 'Purchase Analytics', icon: BarChart3 }
      );
    }

    // Project Manager specific items
    if (['ADMIN', 'PROJECT_MANAGER', 'MANAGER'].includes(role)) {
      items.push(
        { path: '/projects', label: 'Projects', icon: Briefcase },
        { path: '/projects/tasks', label: 'Project Tasks', icon: Target },
        { path: '/employee/tasks', label: 'Task Management', icon: Target }
      );
    }

    // Manager general access
    if (['ADMIN', 'MANAGER', 'HR_MANAGER', 'FINANCE_MANAGER', 'SALES_MANAGER', 'INVENTORY_MANAGER', 'PURCHASE_MANAGER', 'PROJECT_MANAGER'].includes(role)) {
      items.push(
        { path: '/users', label: 'Users', icon: Users },
        { path: '/departments', label: 'Departments', icon: Building2 },
        { path: '/reports', label: 'Reports', icon: BarChart3 },
        { path: '/approvals/dashboard', label: 'Approval Dashboard', icon: CheckCircle },
        { path: '/employee/tasks', label: 'Team Tasks', icon: Target }
      );
    }

    // USER role - basic access
    if (role === 'USER') {
      items.push(
        { path: '/inventory', label: 'Inventory', icon: Package },
        { path: '/documents', label: 'Documents', icon: FileText },
        { path: '/communication/messages', label: 'Messages', icon: MessageSquare },
        { path: '/notifications', label: 'Notifications', icon: Bell }
      );
    }

    // Common items for most roles (Staff and above)
    if (role !== 'EMPLOYEE' && role !== 'USER') {
      items.push(
        { path: '/assets', label: 'Assets', icon: Box },
        { path: '/documents', label: 'Documents', icon: FileText },
        { path: '/communication/messages', label: 'Messages', icon: MessageSquare },
        { path: '/communication/announcements', label: 'Announcements', icon: Bell },
        { path: '/notifications', label: 'Notifications', icon: Bell },
        { path: '/approvals', label: 'My Approvals', icon: CheckCircle }
      );
    }

    // Admin only items
    if (role === 'ADMIN') {
      items.push(
        { path: '/role-management', label: 'Role Management', icon: ShieldCheck },
        { path: '/roles', label: 'Roles & Permissions', icon: Shield },
        { path: '/company', label: 'Company Settings', icon: Settings },
        { path: '/system-options', label: 'System', icon: Settings },
        { path: '/audit', label: 'Audit Logs', icon: FileText }
      );
    }

    return items;
  };

  const menuItems = getMenuItems();

  // Remove duplicates by path
  const filteredMenuItems = Array.from(
    new Map(menuItems.map(item => [item.path, item])).values()
  );

  const handleLogout = () => {
    removeToken();
    window.location.href = '/';
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'ADMIN': { color: 'bg-gradient-to-r from-red-500 to-pink-500 text-white', icon: Crown },
      'MANAGER': { color: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white', icon: ZapIcon },
      'HR_MANAGER': { color: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white', icon: UserCheck },
      'HR_STAFF': { color: 'bg-gradient-to-r from-purple-400 to-purple-600 text-white', icon: Users },
      'FINANCE_MANAGER': { color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white', icon: DollarSign },
      'ACCOUNTANT': { color: 'bg-gradient-to-r from-green-400 to-teal-500 text-white', icon: FileText },
      'INVENTORY_MANAGER': { color: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white', icon: Package },
      'WAREHOUSE_STAFF': { color: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white', icon: Box },
      'SALES_MANAGER': { color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white', icon: Target },
      'SALES_STAFF': { color: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white', icon: Briefcase },
      'PURCHASE_MANAGER': { color: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white', icon: ShoppingCart },
      'PROJECT_MANAGER': { color: 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white', icon: Briefcase },
      'EMPLOYEE': { color: 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white', icon: User },
      'USER': { color: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white', icon: User }
    };
    const config = roleConfig[role] || roleConfig['USER'];
    const IconComponent = config.icon;
    
    return (
      <div className={`${config.color} px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 shadow-sm`}>
        <IconComponent className="w-3 h-3" />
        {!collapsed && <span>{role.replace('_', ' ')}</span>}
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