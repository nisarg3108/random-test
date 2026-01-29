import React, { useState, useEffect } from 'react';
import { hrAPI } from '../../api/hr.api';
import { DollarSign, Plus, Edit, Users, Calculator } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SalaryManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    basicSalary: '',
    allowances: {
      hra: '',
      transport: '',
      medical: '',
      bonus: ''
    },
    deductions: {
      pf: '',
      tax: '',
      insurance: '',
      other: ''
    },
    effectiveFrom: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await hrAPI.getEmployees();
      setEmployees(response.data || []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      // Convert string values to numbers
      const processedData = {
        ...formData,
        basicSalary: parseFloat(formData.basicSalary),
        allowances: Object.fromEntries(
          Object.entries(formData.allowances).map(([key, value]) => [key, parseFloat(value) || 0])
        ),
        deductions: Object.fromEntries(
          Object.entries(formData.deductions).map(([key, value]) => [key, parseFloat(value) || 0])
        )
      };

      await hrAPI.createSalaryStructure(processedData);
      setSuccess('Salary structure created successfully!');
      setShowForm(false);
      setEditingEmployee(null);
      resetForm();
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create salary structure');
      console.error('Failed to create salary structure:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      basicSalary: '',
      allowances: {
        hra: '',
        transport: '',
        medical: '',
        bonus: ''
      },
      deductions: {
        pf: '',
        tax: '',
        insurance: '',
        other: ''
      },
      effectiveFrom: new Date().toISOString().split('T')[0]
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    if (employee.salaryStructure) {
      setFormData({
        employeeId: employee.id,
        basicSalary: employee.salaryStructure.basicSalary.toString(),
        allowances: Object.fromEntries(
          Object.entries(employee.salaryStructure.allowances).map(([key, value]) => [key, value.toString()])
        ),
        deductions: Object.fromEntries(
          Object.entries(employee.salaryStructure.deductions).map(([key, value]) => [key, value.toString()])
        ),
        effectiveFrom: new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData(prev => ({
        ...prev,
        employeeId: employee.id
      }));
    }
    setShowForm(true);
  };

  const calculateNetSalary = () => {
    const basic = parseFloat(formData.basicSalary) || 0;
    const totalAllowances = Object.values(formData.allowances).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const totalDeductions = Object.values(formData.deductions).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    return basic + totalAllowances - totalDeductions;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {loading && (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Salary Management</h1>
            <p className="text-primary-600 mt-1">Manage employee salary structures and compensation</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingEmployee(null);
              resetForm();
            }}
            className="btn-modern btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Salary Structure</span>
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Total Employees</p>
                <p className="text-xl font-bold text-primary-900 mt-1">{employees.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">With Salary Structure</p>
                <p className="text-xl font-bold text-primary-900 mt-1">
                  {employees.filter(emp => emp.salaryStructure).length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <Calculator className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Average Salary</p>
                <p className="text-xl font-bold text-primary-900 mt-1">
                  ₹{employees.filter(emp => emp.salaryStructure).length > 0 
                    ? Math.round(employees.filter(emp => emp.salaryStructure)
                        .reduce((sum, emp) => sum + (emp.salaryStructure?.netSalary || 0), 0) / 
                        employees.filter(emp => emp.salaryStructure).length).toLocaleString()
                    : '0'}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Salary Form */}
        {showForm && (
          <div className="modern-card-elevated p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">
              {editingEmployee ? `Edit Salary - ${editingEmployee.name || `${editingEmployee.firstName} ${editingEmployee.lastName}`}` : 'Create Salary Structure'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {!editingEmployee && (
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Select Employee *
                  </label>
                  <select
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    required
                    className="input-modern"
                  >
                    <option value="">Choose Employee</option>
                    {employees.filter(employee => !employee.salaryStructure).map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name || `${employee.firstName} ${employee.lastName}`} - {employee.designation || employee.position}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Salary */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Basic Salary *
                  </label>
                  <input
                    type="number"
                    name="basicSalary"
                    value={formData.basicSalary}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="input-modern"
                    placeholder="Enter basic salary"
                  />
                </div>

                {/* Effective From */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Effective From *
                  </label>
                  <input
                    type="date"
                    name="effectiveFrom"
                    value={formData.effectiveFrom}
                    onChange={handleInputChange}
                    required
                    className="input-modern"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Allowances */}
                <div>
                  <h3 className="text-md font-medium text-primary-900 mb-3">Allowances</h3>
                  <div className="space-y-3">
                    {Object.entries(formData.allowances).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-primary-700 mb-1 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </label>
                        <input
                          type="number"
                          name={`allowances.${key}`}
                          value={value}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="input-modern"
                          placeholder="0.00"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h3 className="text-md font-medium text-primary-900 mb-3">Deductions</h3>
                  <div className="space-y-3">
                    {Object.entries(formData.deductions).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-primary-700 mb-1 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </label>
                        <input
                          type="number"
                          name={`deductions.${key}`}
                          value={value}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="input-modern"
                          placeholder="0.00"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Net Salary Preview */}
              <div className="bg-primary-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-primary-900">Net Salary:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₹{calculateNetSalary().toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingEmployee(null);
                    resetForm();
                  }}
                  className="btn-modern btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modern btn-primary"
                >
                  {editingEmployee ? 'Update' : 'Create'} Salary Structure
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Employees List */}
        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">Employee Salary Overview</h2>
          </div>
          <div className="p-6">
            {employees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No employees found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="border border-primary-200 rounded-lg p-4 hover:bg-primary-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-primary-900">
                            {employee.name || `${employee.firstName} ${employee.lastName}`}
                          </h3>
                          <span className="text-sm text-primary-600">
                            {employee.designation || employee.position}
                          </span>
                          <span className="text-sm text-primary-500">•</span>
                          <span className="text-sm text-primary-600">
                            {employee.department?.name || 'No Department'}
                          </span>
                        </div>
                        {employee.salaryStructure ? (
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-primary-600">Basic: </span>
                              <span className="font-medium">₹{employee.salaryStructure.basicSalary.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-primary-600">Allowances: </span>
                              <span className="font-medium text-green-600">
                                +₹{Object.values(employee.salaryStructure.allowances).reduce((sum, val) => sum + val, 0).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-primary-600">Deductions: </span>
                              <span className="font-medium text-red-600">
                                -₹{Object.values(employee.salaryStructure.deductions).reduce((sum, val) => sum + val, 0).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-primary-600">Net: </span>
                              <span className="font-bold text-blue-600">₹{employee.salaryStructure.netSalary.toLocaleString()}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-primary-500 mt-2">No salary structure configured</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={employee.salaryStructure ? 'Edit Salary' : 'Add Salary Structure'}
                        >
                          {employee.salaryStructure ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SalaryManagement;