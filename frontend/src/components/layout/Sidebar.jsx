import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, Package, Building2, Users, Mail, Shield, 
  ShieldCheck, Zap, CheckCircle, FileText, Settings, 
  BarChart3, ChevronLeft, ChevronRight, LogOut, Sparkles
} from 'lucide-react';
import { removeToken } from '../../store/auth.store';

const Sidebar = () => {
  const location = useLocation();
  const { user, hasRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  if (!user) return null;

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, minRole: 'USER', gradient: 'from-blue-500 to-blue-600' },
    { path: '/inventory', label: 'Inventory', icon: Package, minRole: 'USER', gradient: 'from-green-500 to-green-600' },
    { path: '/inventory-dashboard', label: 'Inventory Analytics', icon: BarChart3, minRole: 'USER', gradient: 'from-emerald-500 to-emerald-600' },
    { path: '/departments', label: 'Departments', icon: Building2, minRole: 'USER', gradient: 'from-purple-500 to-purple-600' },
    { path: '/users', label: 'Users', icon: Users, minRole: 'MANAGER', gradient: 'from-indigo-500 to-indigo-600' },
    { path: '/invite', label: 'Invite Users', icon: Mail, minRole: 'MANAGER', gradient: 'from-pink-500 to-pink-600' },
    { path: '/roles', label: 'Roles', icon: Shield, minRole: 'ADMIN', gradient: 'from-red-500 to-red-600' },
    { path: '/permissions', label: 'Permissions', icon: ShieldCheck, minRole: 'ADMIN', gradient: 'from-orange-500 to-orange-600' },
    { path: '/workflows', label: 'Workflows', icon: Zap, minRole: 'USER', gradient: 'from-yellow-500 to-yellow-600' },
    { path: '/approvals', label: 'Approvals', icon: CheckCircle, minRole: 'USER', gradient: 'from-teal-500 to-teal-600' },
    { path: '/audit', label: 'Audit Logs', icon: FileText, minRole: 'MANAGER', gradient: 'from-slate-500 to-slate-600' },
    { path: '/company', label: 'Company Settings', icon: Settings, minRole: 'ADMIN', gradient: 'from-cyan-500 to-cyan-600' },
    { path: '/system-options', label: 'System Options', icon: Settings, minRole: 'ADMIN', gradient: 'from-violet-500 to-violet-600' },
    { path: '/reports', label: 'Reports', icon: BarChart3, minRole: 'USER', gradient: 'from-rose-500 to-rose-600' }
  ];

  const filteredMenuItems = menuItems.filter(item => hasRole(item.minRole));

  const handleLogout = () => {
    removeToken();
    window.location.href = '/';
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'ADMIN': { color: 'bg-gradient-to-r from-red-500 to-pink-500', text: 'text-white', icon: '👑' },
      'MANAGER': { color: 'bg-gradient-to-r from-blue-500 to-indigo-500', text: 'text-white', icon: '⚡' },
      'USER': { color: 'bg-gradient-to-r from-green-500 to-emerald-500', text: 'text-white', icon: '👤' }
    };
    const config = roleConfig[role] || roleConfig['USER'];
    
    return (
      <div className={`${config.color} px-2 py-1 rounded-full text-xs font-bold ${config.text} flex items-center space-x-1 shadow-lg`}>
        <span>{config.icon}</span>
        {!collapsed && <span>{role}</span>}
      </div>
    );
  };

  return (
    <div className={`bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white min-h-screen transition-all duration-300 relative overflow-hidden saas-shadow-xl ${
      collapsed ? 'w-20' : 'w-80'
    }`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Header */}
      <div className="relative p-8 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="animate-slide-right">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl animate-float">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gradient bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    UEORMS
                  </h2>
                  <p className="text-sm text-slate-400 font-semibold">Enterprise Suite</p>
                </div>
              </div>
              <div className="mt-4">
                {getRoleBadge(user.role)}
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-3 rounded-2xl hover:bg-slate-700/50 transition-all duration-200 hover:scale-110 group saas-shadow hover:saas-shadow-lg"
          >
            {collapsed ? 
              <ChevronRight className="w-6 h-6 group-hover:text-primary-400 transition-colors" /> : 
              <ChevronLeft className="w-6 h-6 group-hover:text-primary-400 transition-colors" />
            }
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 relative">
        {filteredMenuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isHovered = hoveredItem === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`relative flex items-center px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/25 scale-105'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white hover:scale-105'
              }`}
              title={collapsed ? item.label : ''}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Background glow effect */}
              {(isActive || isHovered) && (
                <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-10 rounded-xl`}></div>
              )}
              
              {/* Icon container */}
              <div className={`relative z-10 p-2 rounded-lg transition-all duration-300 ${
                isActive ? 'bg-white/20 shadow-lg' : 'group-hover:bg-white/10'
              }`}>
                <Icon className={`w-5 h-5 transition-all duration-300 ${
                  isActive ? 'text-white scale-110' : 'group-hover:scale-110'
                }`} />
              </div>
              
              {!collapsed && (
                <div className="relative z-10 ml-4 flex-1">
                  <span className="font-medium text-sm">{item.label}</span>
                  {isActive && (
                    <div className="w-full h-0.5 bg-white/30 rounded-full mt-1 animate-scale-in"></div>
                  )}
                </div>
              )}
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full animate-scale-in"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        {!collapsed && (
          <div className="mb-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.email?.split('@')[0]}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
                <p className="text-xs text-slate-500">ID: {user.id}</p>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-4 py-3 text-slate-300 hover:bg-red-600/20 hover:text-red-400 rounded-xl transition-all duration-300 group border border-transparent hover:border-red-500/30 ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Logout' : ''}
        >
          <div className="p-2 rounded-lg group-hover:bg-red-500/20 transition-all duration-300">
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          {!collapsed && <span className="ml-3 font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;