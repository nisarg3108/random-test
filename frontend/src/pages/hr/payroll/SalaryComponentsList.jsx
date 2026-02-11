import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import payrollAPI from '../../../api/payrollAPI';
import { 
  Plus, 
  Edit,
  TrendingUp,
  TrendingDown,
  Gift,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  Percent,
  Calculator
} from 'lucide-react';
import Layout from '../../../components/layout/Layout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export default function SalaryComponentsList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [components, setComponents] = useState([]);
  const [filter, setFilter] = useState('all'); // all, ALLOWANCE, DEDUCTION, BONUS

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const response = await payrollAPI.getSalaryComponents();
      setComponents(response.data || response || []);
    } catch (error) {
      console.error('Failed to fetch salary components:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleComponentStatus = async (id, currentStatus) => {
    try {
      await payrollAPI.updateSalaryComponent(id, { isActive: !currentStatus });
      fetchComponents();
    } catch (error) {
      console.error('Failed to toggle component status:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'ALLOWANCE':
        return <TrendingUp className="w-5 h-5" />;
      case 'DEDUCTION':
        return <TrendingDown className="w-5 h-5" />;
      case 'BONUS':
        return <Gift className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  const getTypeBadge = (type) => {
    const config = {
      ALLOWANCE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Allowance' },
      DEDUCTION: { bg: 'bg-red-100', text: 'text-red-700', label: 'Deduction' },
      BONUS: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Bonus' }
    };
    
    const { bg, text, label } = config[type] || config.ALLOWANCE;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  const getCalculationIcon = (calculationType) => {
    switch (calculationType) {
      case 'FIXED':
        return <DollarSign className="w-4 h-4" />;
      case 'PERCENTAGE_OF_BASIC':
      case 'PERCENTAGE_OF_GROSS':
        return <Percent className="w-4 h-4"  />;
      case 'FORMULA':
        return <Calculator className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatCalculation = (component) => {
    switch (component.calculationType) {
      case 'FIXED':
        return `₹${component.value?.toLocaleString('en-IN')} (Fixed)`;
      case 'PERCENTAGE_OF_BASIC':
        return `${component.value}% of Basic Salary`;
      case 'PERCENTAGE_OF_GROSS':
        return `${component.value}% of Gross Salary`;
      case 'FORMULA':
        return `Custom Formula: ${component.formula}`;
      default:
        return 'Not configured';
    }
  };

  const filteredComponents = filter === 'all' 
    ? components 
    : components.filter(c => c.type === filter);

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
            <h1 className="text-2xl font-bold text-gray-900">Salary Components</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage allowances, deductions, and bonuses with dynamic formulas
            </p>
          </div>
          <button
            onClick={() => navigate('/hr/payroll/components/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Component
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
              All ({components.length})
            </button>
            <button
              onClick={() => setFilter('ALLOWANCE')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'ALLOWANCE'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Allowances ({components.filter(c => c.type === 'ALLOWANCE').length})
            </button>
            <button
              onClick={() => setFilter('DEDUCTION')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'DEDUCTION'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Deductions ({components.filter(c => c.type === 'DEDUCTION').length})
            </button>
            <button
              onClick={() => setFilter('BONUS')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'BONUS'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Bonuses ({components.filter(c => c.type === 'BONUS').length})
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Allowances
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {components.filter(c => c.type === 'ALLOWANCE' && c.isActive).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingDown className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Deductions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {components.filter(c => c.type === 'DEDUCTION' && c.isActive).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Gift className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Bonuses
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {components.filter(c => c.type === 'BONUS' && c.isActive).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Components List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {filteredComponents.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No components found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new salary component.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/hr/payroll/components/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Component
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Component
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Calculation
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taxable
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredComponents.map((component) => (
                    <tr key={component.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 p-2 rounded-lg ${
                            component.type === 'ALLOWANCE' ? 'bg-green-100' :
                            component.type === 'DEDUCTION' ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            {getTypeIcon(component.type)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {component.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {component.code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(component.type)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <span className="mr-2">{getCalculationIcon(component.calculationType)}</span>
                          {formatCalculation(component)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {component.isTaxable ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Taxable
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Exempt
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleComponentStatus(component.id, component.isActive)}
                          className="inline-flex items-center text-sm"
                        >
                          {component.isActive ? (
                            <>
                              <ToggleRight className="w-8 h-8 text-green-500" />
                              <span className="ml-2 text-green-700 font-medium">Active</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-8 h-8 text-gray-400" />
                              <span className="ml-2 text-gray-500">Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => navigate(`/hr/payroll/components/${component.id}`)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
