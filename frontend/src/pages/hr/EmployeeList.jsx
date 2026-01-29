import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, UserCheck, Building } from 'lucide-react';
import { hrAPI } from '../../api/hr.api';
import { apiClient } from '../../api/http';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    departmentId: '',
    salary: '',
    joiningDate: ''
  });

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await hrAPI.getEmployees();
      setEmployees(response.data || []);
    } catch (err) {
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await apiClient.get('/departments');
      setDepartments(response.data || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const employeeData = {
        ...formData,
        salary: parseFloat(formData.salary),
        departmentId: formData.departmentId
      };

      await hrAPI.createEmployee(employeeData);
      setShowModal(false);
      resetForm();
      loadEmployees();
    } catch (err) {
      setError(err.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignManager = async (managerId) => {
    try {
      await hrAPI.assignManager({
        employeeId: selectedEmployee.id,
        managerId: managerId || null
      });
      setShowManagerModal(false);
      setSelectedEmployee(null);
      loadEmployees();
    } catch (err) {
      setError('Failed to assign manager');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      departmentId: '',
      salary: '',
      joiningDate: ''
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredEmployees = employees.filter(emp => {
    const fullName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`;
    const position = emp.designation || emp.position || '';
    const email = emp.email || '';
    
    return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           position.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const potentialManagers = employees.filter(emp => 
    emp.id !== selectedEmployee?.id
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Employee Management</h1>
            <p className="text-primary-600 mt-1">Manage employees and organizational structure</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-modern btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
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
                <p className="text-sm font-medium text-primary-600">Departments</p>
                <p className="text-xl font-bold text-primary-900 mt-1">{departments.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <Building className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">With Managers</p>
                <p className="text-xl font-bold text-primary-900 mt-1">
                  {employees.filter(emp => emp.managerId).length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50">
                <UserCheck className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="modern-card-elevated p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
        </div>

        {/* Employee Table */}
        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">Employees ({filteredEmployees.length})</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8">
                <LoadingSpinner />
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No employees found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Manager</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Joining Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-primary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-primary-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {(employee.name || `${employee.firstName} ${employee.lastName}`).split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-primary-900">
                              {employee.name || `${employee.firstName} ${employee.lastName}`}
                            </div>
                            <div className="text-sm text-primary-500">{employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-primary-900">{employee.designation || employee.position}</td>
                      <td className="px-6 py-4 text-sm text-primary-900">
                        {employee.department?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-primary-900">
                        {employee.manager ? 
                          (employee.manager.name || `${employee.manager.firstName} ${employee.manager.lastName}`) : 
                          'No Manager'
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-primary-900">
                        {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowManagerModal(true);
                          }}
                          className="btn-modern btn-secondary text-xs"
                        >
                          Assign Manager
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="modern-card-elevated max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-primary-200">
              <h3 className="text-lg font-semibold text-primary-900">Add New Employee</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">First Name</label>
                  <input
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Last Name</label>
                  <input
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="input-modern"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Phone</label>
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Position</label>
                <input
                  name="position"
                  type="text"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Department</label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  required
                  className="input-modern"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Salary</label>
                <input
                  name="salary"
                  type="number"
                  step="0.01"
                  value={formData.salary}
                  onChange={handleChange}
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Joining Date</label>
                <input
                  name="joiningDate"
                  type="date"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  className="input-modern"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn-modern btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-modern btn-primary disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Manager Modal */}
      {showManagerModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="modern-card-elevated max-w-md w-full">
            <div className="px-6 py-4 border-b border-primary-200">
              <h3 className="text-lg font-semibold text-primary-900">
                Assign Manager to {selectedEmployee.name || `${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
              </h3>
            </div>
            <div className="p-6">
              {potentialManagers.length === 0 ? (
                <p className="text-gray-600">No other employees available</p>
              ) : (
                <div className="space-y-2">
                  {selectedEmployee.managerId && (
                    <button
                      onClick={() => handleAssignManager(null)}
                      className="w-full text-left p-3 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                    >
                      <div className="font-medium text-red-700">
                        Remove Current Manager
                      </div>
                      <div className="text-sm text-red-600">Unassign manager from this employee</div>
                    </button>
                  )}
                  {potentialManagers.map(manager => (
                    <button
                      key={manager.id}
                      onClick={() => handleAssignManager(manager.id)}
                      className="w-full text-left p-3 rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors"
                    >
                      <div className="font-medium text-primary-900">
                        {manager.name || `${manager.firstName} ${manager.lastName}`}
                      </div>
                      <div className="text-sm text-primary-600">{manager.designation || manager.position}</div>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => { setShowManagerModal(false); setSelectedEmployee(null); }}
                  className="btn-modern btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EmployeeList;