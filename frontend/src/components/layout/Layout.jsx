import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../hooks/useAuth';
import { FullPageLoader } from '../common/LoadingSpinner';
import RoleSwitcher from '../common/RoleSwitcher';
import { getToken, removeToken } from '../../store/auth.store';
import { Shield, AlertTriangle } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoader message="Loading your workspace..." />;
  }

  const token = getToken();
  if (token && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-red-100 rounded-2xl mx-auto flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">
              Authentication Error
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              There was an issue with your session. Please sign in again to continue.
            </p>
          </div>
          <button 
            onClick={() => {
              removeToken();
              window.location.href = '/';
            }}
            className="btn-modern btn-primary"
          >
            Sign In Again
          </button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl mx-auto flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">
              Access Required
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Please sign in to access your workspace and continue managing your business.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn-modern btn-primary"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="bg-white sticky top-0 z-30 border-b border-gray-200">
          <RoleSwitcher />
          <Header />
        </div>
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;