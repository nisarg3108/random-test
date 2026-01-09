import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Bell, Search, User, ChevronDown, Sun, Moon, Settings, HelpCircle, Zap } from 'lucide-react';
import { removeToken } from '../../store/auth.store';

const Header = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications] = useState([
    { id: 1, title: 'New user registered', message: 'john.doe@company.com joined', time: '5m ago', type: 'info', unread: true },
    { id: 2, title: 'Inventory alert', message: 'Low stock on Product A', time: '15m ago', type: 'warning', unread: true },
    { id: 3, title: 'System update', message: 'Maintenance completed', time: '1h ago', type: 'success', unread: false }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu') && !event.target.closest('.notifications-menu')) {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    const pathMap = {
      '/dashboard': { title: 'Dashboard', subtitle: 'Overview and analytics', icon: '📊' },
      '/inventory': { title: 'Inventory Management', subtitle: 'Manage your stock and products', icon: '📦' },
      '/inventory-dashboard': { title: 'Inventory Analytics', subtitle: 'Stock insights and reports', icon: '📈' },
      '/departments': { title: 'Department Management', subtitle: 'Organize your teams', icon: '🏢' },
      '/users': { title: 'User Management', subtitle: 'Manage team members', icon: '👥' },
      '/invite': { title: 'Invite Users', subtitle: 'Add new team members', icon: '✉️' },
      '/roles': { title: 'Role Management', subtitle: 'Configure user permissions', icon: '🛡️' },
      '/permissions': { title: 'Permission Matrix', subtitle: 'Fine-tune access control', icon: '🔐' },
      '/workflows': { title: 'Workflow Management', subtitle: 'Automate your processes', icon: '⚡' },
      '/approvals': { title: 'Approval Queue', subtitle: 'Review pending requests', icon: '✅' },
      '/audit': { title: 'Audit Logs', subtitle: 'Track system activities', icon: '📋' },
      '/company': { title: 'Company Settings', subtitle: 'Configure your organization', icon: '⚙️' },
      '/system-options': { title: 'System Options', subtitle: 'Advanced configurations', icon: '🔧' },
      '/reports': { title: 'Reports & Analytics', subtitle: 'Business intelligence', icon: '📊' }
    };
    return pathMap[location.pathname] || { title: 'ERP System', subtitle: 'Enterprise Resource Planning', icon: '🏢' };
  };

  const handleLogout = () => {
    removeToken();
    window.location.href = '/';
  };

  const getRoleBadge = (role) => {
    const colors = {
      'ADMIN': 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25',
      'MANAGER': 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25',
      'USER': 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[role] || colors['USER']} animate-pulse-glow`}>
        {role}
      </span>
    );
  };

  const getNotificationIcon = (type) => {
    const icons = {
      info: '💡',
      warning: '⚠️',
      success: '✅',
      error: '❌'
    };
    return icons[type] || '📢';
  };

  const pageInfo = getPageTitle();

  return (
    <header className="saas-card border-0 px-8 py-6 sticky top-0 z-40">
      <div className="flex justify-between items-center">
        {/* Page Title */}
        <div className="animate-slide-right">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg animate-float">
              {pageInfo.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">
                {pageInfo.title}
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">{pageInfo.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-6">
          {/* Search */}
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anything..."
              className="input-modern pl-12 pr-4 py-3 w-80 text-sm placeholder-slate-400 focus:w-96 transition-all duration-300 saas-shadow"
            />
            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-3 saas-card p-3 animate-slide-up saas-shadow-lg">
                <div className="text-sm text-slate-500 p-3">No results found for "{searchQuery}"</div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            <button className="p-3 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 hover:scale-110 saas-shadow hover:saas-shadow-lg">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 text-slate-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all duration-200 hover:scale-110 saas-shadow hover:saas-shadow-lg"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          {/* Notifications */}
          <div className="relative notifications-menu">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 hover:scale-110 group saas-shadow hover:saas-shadow-lg"
            >
              <Bell className="w-5 h-5 group-hover:animate-pulse" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce shadow-lg">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-96 saas-card py-3 z-50 animate-scale-in saas-shadow-xl">
                <div className="px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-lg">Notifications</h3>
                    <span className="text-xs bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full font-semibold">
                      {unreadCount} new
                    </span>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className={`px-4 py-3 hover:bg-slate-50 transition-colors border-l-4 ${
                      notification.unread ? 'border-indigo-500 bg-indigo-50/30' : 'border-transparent'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <div className="text-lg">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{notification.title}</p>
                          <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{notification.time}</p>
                        </div>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-slate-100">
                  <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative user-menu">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-xl transition-all duration-200 hover:scale-105 group"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:shadow-xl transition-shadow">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white status-online"></div>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-900">{user?.email?.split('@')[0] || 'User'}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {user?.role && getRoleBadge(user.role)}
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${
                showUserMenu ? 'rotate-180' : ''
              }`} />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-scale-in">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user?.email}</p>
                      <p className="text-xs text-slate-500">ID: {user?.id}</p>
                      <div className="mt-1">
                        {user?.role && getRoleBadge(user.role)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="py-2">
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-3">
                    <User className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-3">
                    <Settings className="w-4 h-4" />
                    <span>Preferences</span>
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-3">
                    <Zap className="w-4 h-4" />
                    <span>Keyboard Shortcuts</span>
                  </button>
                </div>
                
                <div className="border-t border-slate-100 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3 font-medium"
                  >
                    <span className="text-lg">🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;