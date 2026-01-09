import React from 'react';
import { Loader2 } from 'lucide-react';

// Modern SaaS Button Component
export const SaasButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false,
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-primary-500',
    secondary: 'saas-card text-slate-700 hover:text-slate-900 saas-shadow hover:saas-shadow-lg hover:-translate-y-0.5 focus:ring-primary-500',
    outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 hover:-translate-y-0.5 focus:ring-primary-500',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-500',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-red-500'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-2xl',
    xl: 'px-10 py-5 text-xl rounded-2xl'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

// Modern SaaS Card Component
export const SaasCard = ({ 
  children, 
  variant = 'default', 
  padding = 'md',
  hover = false,
  className = '',
  ...props 
}) => {
  const baseClasses = 'saas-card transition-all duration-300';
  
  const variants = {
    default: 'saas-shadow',
    elevated: 'saas-shadow-lg',
    premium: 'saas-shadow-xl border-2 border-primary-100',
    glass: 'glass-card'
  };
  
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };
  
  const hoverClasses = hover ? 'hover:saas-shadow-xl hover:-translate-y-1 cursor-pointer' : '';
  
  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${paddings[padding]} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default {
  SaasButton,
  SaasCard
};