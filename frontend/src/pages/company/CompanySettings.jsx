import React, { useEffect, useState } from 'react';
import { useCompanyStore } from '../../store/company.store';
import { useSystemOptionsStore } from '../../store/systemOptions.store';
import FormField from '../../components/forms/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { RoleGuard } from '../../hooks/useAuth';

const CompanySettings = () => {
  const { config, loading, error, fetchConfig, updateConfig } = useCompanyStore();
  const { fetchOptions } = useSystemOptionsStore();
  const [formData, setFormData] = useState({
    industry: '',
    companySize: '',
    country: '',
    currency: '',
    timezone: '',
    fiscalYear: ''
  });
  const [options, setOptions] = useState({
    industry: [],
    companySize: [],
    currency: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchConfig();
    loadOptions();
  }, [fetchConfig]);

  const loadOptions = async () => {
    const [industryOpts, companySizeOpts, currencyOpts] = await Promise.all([
      fetchOptions('INDUSTRY'),
      fetchOptions('COMPANY_SIZE'),
      fetchOptions('CURRENCY')
    ]);
    
    setOptions({
      industry: industryOpts.map(opt => ({ value: opt.value, label: opt.label })),
      companySize: companySizeOpts.map(opt => ({ value: opt.value, label: opt.label })),
      currency: currencyOpts.map(opt => ({ value: opt.value, label: opt.label }))
    });
  };

  useEffect(() => {
    if (config) {
      setFormData({
        industry: config.industry || '',
        companySize: config.companySize || '',
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
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Edit Settings
                </button>
              )}
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
                        name="companySize"
                        type="select"
                        value={formData.companySize}
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
                        value={formData.timezone}
                        onChange={handleChange}
                        required
                        disabled={!isEditing}
                      />
                      
                      <FormField
                        label="Fiscal Year Start"
                        name="fiscalYear"
                        value={formData.fiscalYear}
                        onChange={handleChange}
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
                                industry: config.industry || '',
                                companySize: config.companySize || '',
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