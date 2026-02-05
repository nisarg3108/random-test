import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../store/auth.store';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    // Check authentication status
    const authStatus = isAuthenticated();
    console.log('ProtectedRoute check:', { 
      isAuth: authStatus, 
      path: location.pathname,
      hasToken: !!localStorage.getItem('ueorms_token')
    });
    setIsAuth(authStatus);
  }, [location.pathname]);

  // Show loading while checking auth
  if (isAuth === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuth) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
