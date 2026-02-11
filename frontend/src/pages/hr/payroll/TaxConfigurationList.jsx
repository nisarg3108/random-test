import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import payrollAPI from '../../../api/payrollAPI';
import { 
  Plus, 
  Edit,
  Calendar,
  TrendingUp,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Shield
} from 'lucide-react';
import Layout from '../../../components/layout/Layout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export default function TaxConfigurationList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [taxConfigs, setTaxConfigs] = useState([]);
  const [filter, setFilter] = useState('all'); // all, INCOME_TAX, PROFESSIONAL_TAX, TDS

  useEffect(() => {
    fetchTaxConfigurations();
  }, []);

  const fetchTaxConfigurations = async () => {
    try {
      setLoading(true);
      const response = await payrollAPI.getTaxConfigurations();
      setTaxConfigs(response.data || response || []);
    } catch (error) {
      console.error('Failed to fetch tax configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Ongoing';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTaxTypeIcon = (type) => {
    switch (type) {
      case 'INCOME_TAX':
      case 'INCOME_TAX_OLD':
        return <DollarSign className="w-5 h-5" />;
      case 'PROFESSIONAL_TAX':
        return <FileText className="w-5 h-5" />;
      case 'TDS':
        return <Shield className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getTaxTypeBadge = (type) => {
    const config = {
      INCOME_TAX: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Income Tax' },
      INCOME_TAX_OLD: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Income Tax (Old)' },
      PROFESSIONAL_TAX: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Professional Tax' },
      TDS: { bg: 'bg-green-100', text: 'text-green-700', label: 'TDS' }
    };
    
    const { bg, text, label } = config[type] || config.INCOME_TAX;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  const filteredConfigs = filter === 'all' 
    ? taxConfigs 
    : taxConfigs.filter(c => c.taxType === filter);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tax Configurations</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage tax slabs and calculations for payroll processing
            </p>
          </div>
          <button
            onClick={() => navigate('/hr/payroll/tax-config/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Configuration
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({taxConfigs.length})
            </button>
            <button
              onClick={() => setFilter('INCOME_TAX')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'INCOME_TAX'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Income Tax ({taxConfigs.filter(c => c.taxType === 'INCOME_TAX').length})
            </button>
            <button
              onClick={() => setFilter('PROFESSIONAL_TAX')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'PROFESSIONAL_TAX'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Professional Tax ({taxConfigs.filter(c => c.taxType === 'PROFESSIONAL_TAX').length})
            </button>
            <button
              onClick={() => setFilter('TDS')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'TDS'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              TDS ({taxConfigs.filter(c => c.taxType === 'TDS').length})
            </button>
          </div>
        </div>

        {/* Tax Configurations List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {filteredConfigs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tax configurations</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new tax configuration.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/hr/payroll/tax-config/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Configuration
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredConfigs.map((config) => (
                <li key={config.id} className="hover:bg-gray-50 transition-colors">
                  <div className="px-6 py-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`flex-shrink-0 p-2 rounded-lg ${
                            config.isActive ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {getTaxTypeIcon(config.taxType)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                {config.name}
                              </h3>
                              {getTaxTypeBadge(config.taxType)}
                              {config.isActive ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {formatDate(config.effectiveFrom)} - {formatDate(config.effectiveTo)}
                              </span>
                              <span>
                                {config.slabs?.length || 0} tax slabs
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Tax Slabs Preview */}
                        <div className="mt-4 bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Tax Slabs:</h4>
                          <div className="space-y-2">
                            {config.slabs?.slice(0, 3).map((slab, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                  ₹{slab.min.toLocaleString('en-IN')} - {slab.max ? `₹${slab.max.toLocaleString('en-IN')}` : '∞'}
                                </span>
                                <span className="font-medium text-gray-900">
                                  {config.taxType === 'PROFESSIONAL_TAX' && typeof slab.rate === 'number' && slab.rate > 50
                                    ? `₹${slab.rate}`
                                    : `${slab.rate}%`}
                                </span>
                              </div>
                            ))}
                            {config.slabs?.length > 3 && (
                              <div className="text-sm text-gray-500 italic">
                                +{config.slabs.length - 3} more slabs
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="ml-6 flex-shrink-0">
                        <button
                          onClick={() => navigate(`/hr/payroll/tax-config/${config.id}`)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
