import React, { useEffect, useState } from 'react';
import { useCompanyStore } from '../../store/company.store';
import FormField from '../../components/forms/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { RoleGuard } from '../../hooks/useAuth';

const CompanySettings = () => {
  const { config, loading, error, fetchConfig, updateConfig } = useCompanyStore();
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    size: '',
    country: '',
    currency: '',
    timezone: '',
    fiscalYear: ''
  });
  const [options, setOptions] = useState({
    industry: [
      { value: 'MANUFACTURING', label: 'Manufacturing' },
      { value: 'IT', label: 'Information Technology' },
      { value: 'RETAIL', label: 'Retail' },
      { value: 'HEALTHCARE', label: 'Healthcare' }
    ],
    companySize: [
      { value: 'SMALL', label: 'Small (1-50 employees)' },
      { value: 'MEDIUM', label: 'Medium (51-200 employees)' },
      { value: 'LARGE', label: 'Large (200+ employees)' }
    ],
    currency: [
      { value: 'USD', label: 'US Dollar' },
      { value: 'EUR', label: 'Euro' },
      { value: 'INR', label: 'Indian Rupee' }
    ],
    timezone: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchConfig();
    loadTimezones();
  }, [fetchConfig]);

  const loadTimezones = async () => {
    try {
      const timezones = Intl.supportedValuesOf('timeZone');
      const timezoneOptions = timezones.map(tz => ({
        value: tz,
        label: tz.replace(/_/g, ' ')
      }));
      
      setOptions(prev => ({ ...prev, timezone: timezoneOptions }));
    } catch (error) {
      console.error('Failed to load timezones:', error);
    }
  };

  useEffect(() => {
    if (config) {
      setFormData({
        companyName: config.companyName || '',
        industry: config.industry || '',
        size: config.size || '',
        country: config.country || '',
        currency: config.currency || '',
        timezone: config.timezone || '',
        fiscalYear: config.fiscalYear || ''
      });
    }
  }, [config]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await updateConfig(formData);
    if (success) {
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <RoleGuard requiredRole="ADMIN" fallback={
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    }>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
                <p className="text-gray-600 mt-1">Configure your company information and preferences</p>
              </div>
              <div className="flex space-x-3">
                <a
                  href="/subscription/billing"
                  className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-900 transition-colors font-medium"
                >
                  Manage Billing
                </a>
                <a
                  href="/company/setup"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Setup Wizard
                </a>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Edit Settings
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                Settings saved successfully!
              </div>
            )}
            
            {loading ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Company Configuration</h2>
                </div>
                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        label="Company Name"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        required
                        disabled={!isEditing}
                      />
                      
                      <FormField
                        label="Industry Type"
                        name="industry"
                        type="select"
                        value={formData.industry}
                        onChange={handleChange}
                        options={options.industry}
                        required
                        disabled={!isEditing}
                      />
                      
                      <FormField
                        label="Company Size"
                        name="size"
                        type="select"
                        value={formData.size}
                        onChange={handleChange}
                        options={options.companySize}
                        required
                        disabled={!isEditing}
                      />
                      
                      <FormField
                        label="Country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        required
                        disabled={!isEditing}
                      />
                      
                      <FormField
                        label="Currency"
                        name="currency"
                        type="select"
                        value={formData.currency}
                        onChange={handleChange}
                        options={options.currency}
                        required
                        disabled={!isEditing}
                      />
                      
                      <FormField
                        label="Timezone"
                        name="timezone"
                        type="select"
                        value={formData.timezone}
                        onChange={handleChange}
                        options={options.timezone}
                        required
                        disabled={!isEditing}
                      />
                    </div>
                    
                    {isEditing && (
                      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            if (config) {
                              setFormData({
                                companyName: config.companyName || '',
                                industry: config.industry || '',
                                size: config.size || '',
                                country: config.country || '',
                                currency: config.currency || '',
                                timezone: config.timezone || '',
                                fiscalYear: config.fiscalYear || ''
                              });
                            }
                          }}
                          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          {loading ? 'Saving...' : 'Save Settings'}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};

export default CompanySettings;