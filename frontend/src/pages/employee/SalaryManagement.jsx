import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../../api/employee.api.js';
import { DollarSign, Plus, Edit, Users } from 'lucide-react';

const SalaryManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
      const response = await employeeAPI.getEmployees();
      setEmployees(response.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      await employeeAPI.createSalaryStructure(processedData);
      setShowForm(false);
      setEditingEmployee(null);
      resetForm();
      fetchEmployees();
    } catch (err) {
      console.error('Failed to create salary structure:', err);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Management</h1>
          <p className="text-gray-600">Manage employee salary structures and compensation</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingEmployee(null);
            resetForm();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Salary Structure</span>
        </button>
      </div>

      {/* Salary Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingEmployee ? `Edit Salary - ${editingEmployee.name}` : 'Create Salary Structure'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {!editingEmployee && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Employee *
                </label>
                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose Employee</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.designation}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter basic salary"
                />
              </div>

              {/* Effective From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective From *
                </label>
                <input
                  type="date"
                  name="effectiveFrom"
                  value={formData.effectiveFrom}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Allowances */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">Allowances</h3>
                <div className="space-y-3">
                  {Object.entries(formData.allowances).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </label>
                      <input
                        type="number"
                        name={`allowances.${key}`}
                        value={value}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">Deductions</h3>
                <div className="space-y-3">
                  {Object.entries(formData.deductions).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </label>
                      <input
                        type="number"
                        name={`deductions.${key}`}
                        value={value}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Net Salary Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Net Salary:</span>
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
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingEmployee ? 'Update' : 'Create'} Salary Structure
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employees List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Employee Salary Overview</h2>
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
                <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{employee.name}</h3>
                        <span className="text-sm text-gray-500">{employee.designation}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{employee.department.name}</span>
                      </div>
                      {employee.salaryStructure ? (
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Basic: </span>
                            <span className="font-medium">₹{employee.salaryStructure.basicSalary.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Allowances: </span>
                            <span className="font-medium text-green-600">
                              +₹{Object.values(employee.salaryStructure.allowances).reduce((sum, val) => sum + val, 0).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Deductions: </span>
                            <span className="font-medium text-red-600">
                              -₹{Object.values(employee.salaryStructure.deductions).reduce((sum, val) => sum + val, 0).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Net: </span>
                            <span className="font-bold text-blue-600">₹{employee.salaryStructure.netSalary.toLocaleString()}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-2">No salary structure configured</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
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
  );
};

export default SalaryManagement;