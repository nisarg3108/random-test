import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, Package, Building2, Users, Mail, Shield, 
  ShieldCheck, Zap, CheckCircle, FileText, Settings, 
  BarChart3, ChevronLeft, ChevronRight, LogOut, Menu
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
    { path: '/departments', label: 'Departments', icon: Building2, minRole: 'USER' },
    { path: '/users', label: 'Users', icon: Users, minRole: 'MANAGER' },
    { path: '/invite', label: 'Invite Users', icon: Mail, minRole: 'MANAGER' },
    { path: '/roles', label: 'Roles', icon: Shield, minRole: 'ADMIN' },
    { path: '/permissions', label: 'Permissions', icon: ShieldCheck, minRole: 'ADMIN' },
    { path: '/workflows', label: 'Workflows', icon: Zap, minRole: 'USER' },
    { path: '/approvals', label: 'Approvals', icon: CheckCircle, minRole: 'USER' },
    { path: '/audit', label: 'Audit Logs', icon: FileText, minRole: 'MANAGER' },
    { path: '/company', label: 'Company', icon: Settings, minRole: 'ADMIN' },
    { path: '/system-options', label: 'System', icon: Settings, minRole: 'ADMIN' },
    { path: '/reports', label: 'Reports', icon: BarChart3, minRole: 'USER' }
  ];

  const filteredMenuItems = menuItems.filter(item => hasRole(item.minRole));

  const handleLogout = () => {
    removeToken();
    window.location.href = '/';
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'ADMIN': { color: 'bg-red-100 text-red-700', icon: '👑' },
      'MANAGER': { color: 'bg-blue-100 text-blue-700', icon: '⚡' },
      'USER': { color: 'bg-emerald-100 text-emerald-700', icon: '👤' }
    };
    const config = roleConfig[role] || roleConfig['USER'];
    
    return (
      <div className={`${config.color} px-2 py-1 rounded-md text-xs font-medium flex items-center space-x-1`}>
        <span>{config.icon}</span>
        {!collapsed && <span>{role}</span>}
      </div>
    );
  };

  return (
    <div className={`bg-white border-r border-gray-200 min-h-screen transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Menu className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">UEORMS</h2>
                  <p className="text-xs text-gray-500">Enterprise Suite</p>
                </div>
              </div>
              <div className="mt-3">
                {getRoleBadge(user.role)}
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {collapsed ? 
              <ChevronRight className="w-4 h-4 text-gray-600" /> : 
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            }
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2 rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={collapsed ? item.label : ''}
            >
              <Icon className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 bg-gray-50">
        {!collapsed && (
          <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.email?.split('@')[0]}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <p className="text-xs text-gray-400">ID: {user.id}</p>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-150 ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Logout' : ''}
        >
          <LogOut className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && <span className="font-medium text-sm">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;