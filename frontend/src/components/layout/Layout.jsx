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
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              Authentication Error
            </h2>
            <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
              There was an issue with your session. Please sign in again to continue.
            </p>
          </div>
          <button 
            onClick={() => {
              removeToken();
              window.location.href = '/';
            }}
            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Sign In Again
          </button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Access Required
            </h2>
            <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
              Please sign in to access your workspace and continue managing your business.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="saas-card sticky top-0 z-30 border-b-0 rounded-none backdrop-blur-xl">
          <RoleSwitcher />
          <Header />
        </div>
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;