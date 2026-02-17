import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Register = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [customModules, setCustomModules] = useState([]);
  const [provider, setProvider] = useState('STRIPE');
  const [plansLoading, setPlansLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const isCustomPlan = selectedPlanId === 'custom';

  useEffect(() => {
    const loadPlans = async () => {
      setPlansLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/billing/public/plans`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Failed to load plans');
        }

        const publicPlans = Array.isArray(result.plans) ? result.plans : [];
        setPlans([
          ...publicPlans,
          {
            id: 'custom',
            name: 'Custom Plan',
            description: 'Choose only the modules you need.'
          }
        ]);
      } catch (err) {
        setError(err.message);
      } finally {
        setPlansLoading(false);
      }
    };

    loadPlans();
  }, []);

  const availableModules = [
    { key: 'INVENTORY', label: 'Inventory Management' },
    { key: 'HR', label: 'Human Resources' },
    { key: 'PAYROLL', label: 'Payroll' },
    { key: 'FINANCE', label: 'Finance & Accounting' },
    { key: 'CRM', label: 'CRM' },
    { key: 'SALES', label: 'Sales & Orders' },
    { key: 'PURCHASE', label: 'Purchase Management' },
    { key: 'PROJECTS', label: 'Projects' },
    { key: 'ASSETS', label: 'Asset Management' },
    { key: 'DOCUMENTS', label: 'Documents' },
    { key: 'COMMUNICATION', label: 'Communication' },
    { key: 'REPORTS', label: 'Reports & Analytics' },
    { key: 'APPROVALS', label: 'Approvals' },
    { key: 'WORKFLOWS', label: 'Workflows' },
    { key: 'MANUFACTURING', label: 'Manufacturing' }
  ];

  const validateForm = () => {
    const errors = {};
    
    if (!formData.companyName.trim()) {
      errors.companyName = 'Company name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!selectedPlanId) {
      errors.plan = 'Please select a plan';
    }

    if (isCustomPlan && customModules.length === 0) {
      errors.customModules = 'Select at least one module for the custom plan';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          email: formData.email,
          password: formData.password,
          planId: isCustomPlan ? undefined : selectedPlanId,
          customModules: isCustomPlan ? customModules : undefined,
          provider
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      if (!result.redirectUrl) {
        throw new Error('Missing payment redirect URL');
      }

      window.location.href = result.redirectUrl;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Registration Card */}
        <div className="modern-card-elevated p-8 space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create Your Company</h1>
            <p className="text-gray-600 text-sm">Set up your ERP system account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
            {/* Payment Provider */}
            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Provider
              </label>
              <select
                id="provider"
                name="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="input-modern"
              >
                <option value="STRIPE">Stripe</option>
                <option value="RAZORPAY">Razorpay</option>
              </select>
            </div>

                Company Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className={`input-modern pl-10 ${
                    validationErrors.companyName ? 'border-red-300' : ''
                  }`}
                  placeholder="Your Company Name"
                />
              </div>
              {validationErrors.companyName && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.companyName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`input-modern pl-10 ${
                    validationErrors.email ? 'border-red-300' : ''
                  }`}
                  placeholder="admin@yourcompany.com"
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`input-modern pl-10 pr-10 ${
                    validationErrors.password ? 'border-red-300' : ''
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
              )}
            </div>

            {/* Plan Selection */}
            <div>
              <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-1">
                Select Plan
              </label>
              <select
                id="plan"
                name="plan"
                value={selectedPlanId}
                onChange={(e) => {
                  setSelectedPlanId(e.target.value);
                  setCustomModules([]);
                  if (validationErrors.plan) {
                    setValidationErrors(prev => ({ ...prev, plan: '' }));
                  }
                }}
                className={`input-modern ${validationErrors.plan ? 'border-red-300' : ''}`}
                disabled={plansLoading}
              >
                <option value="">{plansLoading ? 'Loading plans...' : 'Choose a plan'}</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}{plan.basePrice ? ` - ${plan.currency || 'USD'} ${plan.basePrice}` : ''}
                  </option>
                ))}
              </select>
              {validationErrors.plan && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.plan}</p>
              )}
            </div>

            {isCustomPlan && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Plan Modules
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableModules.map((module) => (
                    <label key={module.key} className="flex items-center space-x-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={customModules.includes(module.key)}
                        onChange={(e) => {
                          const updatedModules = e.target.checked
                            ? [...customModules, module.key]
                            : customModules.filter((item) => item !== module.key);
                          setCustomModules(updatedModules);
                          if (validationErrors.customModules) {
                            setValidationErrors(prev => ({ ...prev, customModules: '' }));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      <span>{module.label}</span>
                    </label>
                  ))}
                </div>
                {validationErrors.customModules && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.customModules}</p>
                )}
              </div>
            )}

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={`input-modern pl-10 pr-10 ${
                    validationErrors.confirmPassword ? 'border-red-300' : ''
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-modern btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Company Account'}
            </button>
          </form>

          {/* Terms */}
          <p className="text-xs text-gray-600 text-center">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>
          </p>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          © 2024 UEORMS. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Register;