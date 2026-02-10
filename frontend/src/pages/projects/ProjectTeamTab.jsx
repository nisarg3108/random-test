import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { apiClient } from '../../api/http';

const ProjectTeamTab = ({ projectId }) => {
  const [members, setMembers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [teamCapacity, setTeamCapacity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [memberForm, setMemberForm] = useState({
    employeeId: '',
    role: '',
    allocationPercent: 50,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    responsibilities: '',
  });

  // Fetch team members
  const fetchMembers = async () => {
    try {
      const response = await apiClient.get(`/projects/${projectId}/members`);
      setMembers(response.data);
    } catch (err) {
      setError('Failed to load team members');
    }
  };

  // Fetch team capacity metrics
  const fetchTeamCapacity = async () => {
    try {
      const response = await apiClient.get(`/projects/${projectId}/members/capacity`);
      setTeamCapacity(response.data);
    } catch (err) {
      console.error('Failed to load capacity metrics', err);
    }
  };

  // Fetch available employees
  const fetchEmployees = async () => {
    try {
      const response = await apiClient.get('/employees');
      // Filter only active employees
      setEmployees(response.data.filter(emp => emp.status === 'ACTIVE'));
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  };

  useEffect(() => {
    if (projectId) {
      Promise.all([fetchMembers(), fetchTeamCapacity(), fetchEmployees()])
        .finally(() => setLoading(false));
    }
  }, [projectId]);

  // Check employee availability before adding
  const checkAvailability = async (employeeId, startDate) => {
    try {
      const response = await apiClient.get(
        `/projects/employees/${employeeId}/availability?startDate=${startDate}`
      );
      return response.data;
    } catch (err) {
      return null;
    }
  };

  // Add team member
  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Check availability first
    const availability = await checkAvailability(memberForm.employeeId, memberForm.startDate);
    
    if (availability && (availability.availablePercent < memberForm.allocationPercent)) {
      setError(
        `Employee only has ${availability.availablePercent}% capacity available. ` +
        `Current allocation: ${availability.currentAllocation}%`
      );
      return;
    }

    try {
      await apiClient.post(`/projects/${projectId}/members`, memberForm);
      setSuccess('Team member added successfully!');
      setShowAddModal(false);
      resetForm();
      fetchMembers();
      fetchTeamCapacity();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add team member');
    }
  };

  // Update team member
  const handleUpdateMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await apiClient.put(`/projects/members/${editingMember.id}`, memberForm);
      setSuccess('Team member updated successfully!');
      setEditingMember(null);
      setShowAddModal(false);
      resetForm();
      fetchMembers();
      fetchTeamCapacity();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update team member');
    }
  };

  // Remove team member
  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;

    try {
      await apiClient.delete(`/projects/members/${memberId}`);
      setSuccess('Team member removed successfully!');
      fetchMembers();
      fetchTeamCapacity();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove team member');
    }
  };

  const resetForm = () => {
    setMemberForm({
      employeeId: '',
      role: '',
      allocationPercent: 50,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      responsibilities: '',
    });
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setMemberForm({
      employeeId: member.employeeId,
      role: member.role,
      allocationPercent: member.allocationPercent,
      startDate: member.startDate?.split('T')[0] || '',
      endDate: member.endDate?.split('T')[0] || '',
      responsibilities: member.responsibilities || '',
    });
    setShowAddModal(true);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Capacity Overview */}
      {teamCapacity && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Team Members</p>
                <p className="text-2xl font-bold text-blue-900">{teamCapacity.totalMembers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Allocation</p>
                <p className="text-2xl font-bold text-purple-900">{teamCapacity.totalAllocation}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Active Members</p>
                <p className="text-2xl font-bold text-green-900">{teamCapacity.activeMembers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Avg Allocation</p>
                <p className="text-2xl font-bold text-amber-900">
                  {teamCapacity.averageAllocation?.toFixed(1) || 0}%
                </p>
              </div>
              <Users className="h-8 w-8 text-amber-600" />
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            <span className="sr-only">Close</span>×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
          <div className="flex-1">
            <p className="text-sm text-green-800">{success}</p>
          </div>
          <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">
            <span className="sr-only">Close</span>×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
        <button
          onClick={() => {
            setEditingMember(null);
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </button>
      </div>

      {/* Team Members List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Allocation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p>No team members assigned yet</p>
                  <p className="text-sm mt-1">Click "Add Member" to get started</p>
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Employee ID: {member.employeeId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(member.allocationPercent, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {member.allocationPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.startDate).toLocaleDateString()} - 
                    {member.endDate ? new Date(member.endDate).toLocaleDateString() : 'Ongoing'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(member.status)}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(member)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingMember ? 'Edit Team Member' : 'Add Team Member'}
            </h3>

            <form onSubmit={editingMember ? handleUpdateMember : handleAddMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee *
                  </label>
                  <select
                    value={memberForm.employeeId}
                    onChange={(e) => setMemberForm({ ...memberForm, employeeId: e.target.value })}
                    required
                    disabled={!!editingMember}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <input
                    type="text"
                    value={memberForm.role}
                    onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                    required
                    placeholder="e.g., Backend Developer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allocation Percent * (0-100%)
                  </label>
                  <input
                    type="number"
                    value={memberForm.allocationPercent}
                    onChange={(e) => setMemberForm({ ...memberForm, allocationPercent: parseInt(e.target.value) })}
                    required
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={memberForm.startDate}
                    onChange={(e) => setMemberForm({ ...memberForm, startDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={memberForm.endDate}
                    onChange={(e) => setMemberForm({ ...memberForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Responsibilities
                  </label>
                  <textarea
                    value={memberForm.responsibilities}
                    onChange={(e) => setMemberForm({ ...memberForm, responsibilities: e.target.value })}
                    rows="3"
                    placeholder="Describe the team member's responsibilities..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMember(null);
                    resetForm();
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingMember ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTeamTab;
