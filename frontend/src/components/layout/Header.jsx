import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Bell, Search, User, ChevronDown, Settings, HelpCircle, LogOut } from 'lucide-react';
import { removeToken } from '../../store/auth.store';
import { notificationAPI } from '../../api/notifications.api';

const Header = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationAPI.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Fallback to empty array if API fails
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

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
      '/dashboard': { title: 'Dashboard', subtitle: 'Overview and analytics' },
      '/inventory': { title: 'Inventory', subtitle: 'Manage your stock and products' },
      '/inventory-dashboard': { title: 'Inventory Analytics', subtitle: 'Stock insights and reports' },
      '/departments': { title: 'Departments', subtitle: 'Organize your teams' },
      '/users': { title: 'Users', subtitle: 'Manage team members' },
      '/invite': { title: 'Invite Users', subtitle: 'Add new team members' },
      '/roles': { title: 'Roles', subtitle: 'Configure user permissions' },
      '/permissions': { title: 'Permissions', subtitle: 'Fine-tune access control' },
      '/workflows': { title: 'Workflows', subtitle: 'Automate your processes' },
      '/approvals': { title: 'Approvals', subtitle: 'Review pending requests' },
      '/audit': { title: 'Audit Logs', subtitle: 'Track system activities' },
      '/company': { title: 'Company Settings', subtitle: 'Configure your organization' },
      '/system-options': { title: 'System Options', subtitle: 'Advanced configurations' },
      '/reports': { title: 'Reports', subtitle: 'Business intelligence' },
      '/sales/quotations': { title: 'Quotations', subtitle: 'Proposals and quote management' },
      '/sales/orders': { title: 'Sales Orders', subtitle: 'Track confirmed orders' },
      '/sales/invoices': { title: 'Invoicing', subtitle: 'Billing and collections' },
      '/sales/tracking': { title: 'Order Tracking', subtitle: 'Shipment status and updates' },
      '/sales/analytics': { title: 'Sales Analytics', subtitle: 'Performance and revenue insights' }
    };
    return pathMap[location.pathname] || { title: 'ERP System', subtitle: 'Enterprise Resource Planning' };
  };

  const handleLogout = () => {
    removeToken();
    window.location.href = '/';
  };

  const getRoleBadge = (role) => {
    const colors = {
      'ADMIN': 'bg-red-100 text-red-700 border-red-200',
      'MANAGER': 'bg-blue-100 text-blue-700 border-blue-200',
      'USER': 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colors[role] || colors['USER']}`}>
        {role}
      </span>
    );
  };

  const pageInfo = getPageTitle();

  return (
    <header className="bg-white border-b border-primary-200 px-6 py-4 sticky top-0 z-40">
      <div className="flex justify-between items-center">
        {/* Page Title */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-primary-900">
            {pageInfo.title}
          </h1>
          <p className="text-sm text-primary-500 mt-1">{pageInfo.subtitle}</p>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-primary-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="input-modern pl-10 pr-4 py-2 w-64 text-sm placeholder-gray-400 focus:w-80 transition-all duration-200"
            />
            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 modern-card-elevated p-3 animate-slide-down">
                <div className="text-sm text-gray-500">No results found for "{searchQuery}"</div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative notifications-menu">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-primary-500 hover:text-primary-700 hover:bg-primary-100 rounded-lg transition-all duration-150"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 modern-card-elevated py-2 z-50 animate-scale-in">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                      {unreadCount} new
                    </span>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {loading ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notification.isRead ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-gray-100">
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium mr-4"
                    >
                      Mark all as read
                    </button>
                  )}
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
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
              className="flex items-center space-x-3 p-2 hover:bg-primary-100 rounded-lg transition-all duration-150"
            >
              <div className="relative">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white status-online"></div>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.email?.split('@')[0] || 'User'}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {user?.role && getRoleBadge(user.role)}
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-150 ${
                showUserMenu ? 'rotate-180' : ''
              }`} />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 modern-card-elevated py-2 z-50 animate-scale-in">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                      <p className="text-xs text-gray-500">ID: {user?.id}</p>
                      <div className="mt-1">
                        {user?.role && getRoleBadge(user.role)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="py-2">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-3">
                    <User className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-3">
                    <Settings className="w-4 h-4" />
                    <span>Preferences</span>
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-3">
                    <HelpCircle className="w-4 h-4" />
                    <span>Help & Support</span>
                  </button>
                </div>
                
                <div className="border-t border-gray-100 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-3 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
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