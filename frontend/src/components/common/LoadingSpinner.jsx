import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-2 border-primary-200 border-t-blue-600`}></div>
    </div>
  );
};

// Full page loading component
export const FullPageLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-4 animate-fade-in">
        <LoadingSpinner size="xl" />
        <div className="space-y-2">
          <p className="text-lg font-semibold text-primary-900">{message}</p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton loader component
export const SkeletonLoader = ({ className = '', lines = 3 }) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="h-4 bg-primary-200 rounded" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
      ))}
    </div>
  );
};

export default LoadingSpinner;