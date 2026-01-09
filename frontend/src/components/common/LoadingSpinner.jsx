import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'indigo', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    indigo: 'border-indigo-600',
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    white: 'border-white'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className="relative">
        {/* Outer ring */}
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-2 border-slate-200`}></div>
        {/* Inner spinning ring */}
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-2 border-transparent ${colorClasses[color]} border-t-transparent absolute top-0 left-0`} style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        {/* Center dot */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 ${colorClasses[color].replace('border-', 'bg-')} rounded-full animate-pulse`}></div>
      </div>
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
          <p className="text-lg font-medium text-slate-900">{message}</p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
        <div key={index} className="skeleton h-4 w-full" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
      ))}
    </div>
  );
};

export default LoadingSpinner;