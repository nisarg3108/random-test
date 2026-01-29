import React, { useState, useEffect } from 'react';
import { Building2, Settings, Users, Workflow } from 'lucide-react';
import { companyAPI } from '../api/company.api';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';

const CompanySetupWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    companyName: '',
    industry: '',
    size: '',
    enabledModules: [],
    workflowConfig: {},
    approvalLevels: {},
    customFields: {}
  });
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (config.industry) {
      fetchWorkflowTemplates();
    }
  }, [config.industry]);

  const fetchWorkflowTemplates = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getWorkflowTemplates(config.industry);
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Failed to load workflow templates');
    } finally {
      setLoading(false);
    }
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!config.companyName.trim()) {
          setError('Company name is required');
          return false;
        }
        if (!config.industry) {
          setError('Please select an industry');
          return false;
        }
        if (!config.size) {
          setError('Please select company size');
          return false;
        }
        break;
      case 2:
        if (config.enabledModules.length === 0) {
          setError('Please select at least one module');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setError('');
    setStep(step + 1);
  };
  
  const handlePrev = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    try {
      setLoading(true);
      setError('');
      
      const setupData = {
        ...config,
        approvalLevels: config.enabledModules.reduce((acc, module) => {
          acc[module] = config.approvalLevels[module] || 1;
          return acc;
        }, {})
      };
      
      await companyAPI.setupCompany(setupData);
      alert('Company setup completed successfully!');
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Setup failed:', error);
      const errorMessage = error.response?.data?.error || 'Setup failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Building2 className="mx-auto h-12 w-12 text-blue-600" />
              <h2 className="mt-4 text-2xl font-bold">Company Information</h2>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Company Name"
                value={config.companyName}
                onChange={(e) => setConfig({...config, companyName: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              
              <select
                value={config.industry}
                onChange={(e) => setConfig({...config, industry: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Industry</option>
                <option value="MANUFACTURING">Manufacturing</option>
                <option value="IT">Information Technology</option>
                <option value="RETAIL">Retail</option>
                <option value="HEALTHCARE">Healthcare</option>
                <option value="FINANCE">Finance</option>
                <option value="EDUCATION">Education</option>
                <option value="OTHER">Other</option>
              </select>
              
              <select
                value={config.size}
                onChange={(e) => setConfig({...config, size: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Company Size</option>
                <option value="SMALL">Small (1-50 employees)</option>
                <option value="MEDIUM">Medium (51-200 employees)</option>
                <option value="LARGE">Large (200+ employees)</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="mx-auto h-12 w-12 text-blue-600" />
              <h2 className="mt-4 text-2xl font-bold">Select Modules</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'INVENTORY', label: 'Inventory Management', desc: 'Track stock, orders, and suppliers' },
                { key: 'HR', label: 'Human Resources', desc: 'Employee management and payroll' },
                { key: 'FINANCE', label: 'Finance & Accounting', desc: 'Financial reporting and accounting' }
              ].map(module => (
                <div key={module.key} className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  config.enabledModules.includes(module.key) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabledModules.includes(module.key)}
                      onChange={(e) => {
                        const modules = e.target.checked
                          ? [...config.enabledModules, module.key]
                          : config.enabledModules.filter(m => m !== module.key);
                        setConfig({...config, enabledModules: modules});
                      }}
                      className="w-5 h-5 mt-1 text-blue-600"
                    />
                    <div>
                      <span className="font-medium block">{module.label}</span>
                      <span className="text-sm text-gray-600">{module.desc}</span>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Workflow className="mx-auto h-12 w-12 text-blue-600" />
              <h2 className="mt-4 text-2xl font-bold">Workflow Configuration</h2>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4">Loading templates...</div>
              ) : templates.length > 0 ? (
                <>
                  <h3 className="text-lg font-semibold">Choose Workflow Templates</h3>
                  {templates.map(template => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                        <button
                          onClick={() => {
                            const newConfig = {...config};
                            if (!newConfig.workflowConfig[template.module]) {
                              newConfig.workflowConfig[template.module] = {};
                            }
                            newConfig.workflowConfig[template.module]['CREATE'] = template.steps;
                            setConfig(newConfig);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Use Template
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold">Create Custom Workflows</h3>
                  <p className="text-sm text-gray-600 mb-4">No templates available. Create workflows for your enabled modules:</p>
                  
                  {config.enabledModules.map(module => {
                    const currentWorkflow = config.workflowConfig[module]?.CREATE || [];
                    return (
                      <div key={module} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">{module} Workflow</h4>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-2">Approval Steps:</label>
                            <select
                              value={currentWorkflow.length || 1}
                              onChange={(e) => {
                                const steps = parseInt(e.target.value);
                                const newConfig = {...config};
                                if (!newConfig.workflowConfig[module]) {
                                  newConfig.workflowConfig[module] = {};
                                }
                                newConfig.workflowConfig[module]['CREATE'] = Array(steps).fill().map((_, i) => ({
                                  permission: i === 0 ? 'MANAGER' : i === 1 ? 'ADMIN' : 'SUPER_ADMIN',
                                  order: i + 1,
                                  role: i === 0 ? 'MANAGER' : i === 1 ? 'ADMIN' : 'SUPER_ADMIN'
                                }));
                                setConfig(newConfig);
                              }}
                              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            >
                              <option value={1}>1 Step</option>
                              <option value={2}>2 Steps</option>
                              <option value={3}>3 Steps</option>
                            </select>
                          </div>
                          
                          {/* Show current workflow steps */}
                          {currentWorkflow.length > 0 && (
                            <div className="bg-gray-50 rounded p-3">
                              <p className="text-sm font-medium mb-2">Workflow Steps:</p>
                              <div className="space-y-1">
                                {currentWorkflow.map((step, index) => (
                                  <div key={index} className="flex items-center space-x-2 text-sm">
                                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                                      {index + 1}
                                    </span>
                                    <span>{step.role || step.permission} Approval</span>
                                    {index < currentWorkflow.length - 1 && (
                                      <span className="text-gray-400">→</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> You can customize these workflows later from the admin panel.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 4:
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      i <= step ? 'bg-blue-600 text-white' : 'bg-gray-200'
                    }`}
                  >
                    {i}
                  </div>
                ))}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              {renderStep()}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={handlePrev}
                disabled={step === 1}
                className="px-6 py-2 border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Next'}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySetupWizard;