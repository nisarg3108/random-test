import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, AlertTriangle, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiClient } from '../../api/http';

const TeamCapacityDashboard = ({ projectId }) => {
  const [capacityData, setCapacityData] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    if (projectId) {
      fetchCapacityData();
    }
  }, [projectId]);

  const fetchCapacityData = async () => {
    try {
      setLoading(true);
      const [capacityResponse, membersResponse] = await Promise.all([
        apiClient.get(`/projects/${projectId}/members/capacity`),
        apiClient.get(`/projects/${projectId}/members`)
      ]);

      setCapacityData(capacityResponse.data);
      setMembers(membersResponse.data);

      // Fetch availability for each member
      const membersWithAvailability = await Promise.all(
        membersResponse.data.map(async (member) => {
          try {
            const availResponse = await apiClient.get(
              `/projects/employees/${member.employeeId}/availability?startDate=${new Date().toISOString().split('T')[0]}`
            );
            return { ...member, availability: availResponse.data };
          } catch (err) {
            return member;
          }
        })
      );

      setMembers(membersWithAvailability);
    } catch (err) {
      setError('Failed to load capacity data');
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for charts
  const allocationChartData = members.map(member => ({
    name: `Emp ${member.employeeId}`,
    allocation: member.allocationPercent,
    available: member.availability?.availablePercent || 0,
  }));

  const roleDistribution = members.reduce((acc, member) => {
    const role = member.role || 'Unassigned';
    const existing = acc.find(item => item.name === role);
    if (existing) {
      existing.value += member.allocationPercent;
      existing.count += 1;
    } else {
      acc.push({ name: role, value: member.allocationPercent, count: 1 });
    }
    return acc;
  }, []);

  const getUtilizationColor = (percent) => {
    if (percent < 50) return 'text-green-600';
    if (percent < 80) return 'text-blue-600';
    if (percent < 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUtilizationBadge = (percent) => {
    if (percent < 50) return { color: 'bg-green-100 text-green-800', text: 'Underutilized' };
    if (percent < 80) return { color: 'bg-blue-100 text-blue-800', text: 'Optimal' };
    if (percent < 100) return { color: 'bg-yellow-100 text-yellow-800', text: 'High' };
    return { color: 'bg-red-100 text-red-800', text: 'Overallocated' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Capacity Overview */}
      {capacityData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Team Members</p>
                <p className="text-2xl font-bold text-blue-900">{capacityData.totalMembers}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {capacityData.activeMembers} active
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Allocation</p>
                <p className="text-2xl font-bold text-purple-900">{capacityData.totalAllocation}%</p>
                <p className="text-xs text-purple-600 mt-1">
                  Across all members
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Avg Allocation</p>
                <p className="text-2xl font-bold text-green-900">
                  {capacityData.averageAllocation?.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Per team member
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Overallocated</p>
                <p className="text-2xl font-bold text-amber-900">
                  {members.filter(m => (m.availability?.currentAllocation || 0) > 100).length}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Employees at risk
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
          </div>
        </div>
      )}

      {/* Allocation Bar Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Member Allocation</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={allocationChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} label={{ value: 'Allocation %', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="allocation" fill="#3B82F6" name="Project Allocation" />
            <Bar dataKey="available" fill="#10B981" name="Available Capacity" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Role Distribution Pie Chart */}
      {roleDistribution.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocation by Role</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-col justify-center space-y-3">
              {roleDistribution.map((role, index) => (
                <div key={role.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">{role.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{role.value}%</div>
                    <div className="text-xs text-gray-500">{role.count} member{role.count !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Member List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Team Member Details</h3>
        </div>
        <div className="overflow-x-auto">
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
                  Project Allocation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Allocation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => {
                const totalAllocation = member.availability?.currentAllocation || member.allocationPercent;
                const available = member.availability?.availablePercent || (100 - member.allocationPercent);
                const badge = getUtilizationBadge(totalAllocation);

                return (
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              totalAllocation > 100 ? 'bg-red-600' : 
                              totalAllocation > 80 ? 'bg-yellow-600' : 'bg-green-600'
                            }`}
                            style={{ width: `${Math.min(totalAllocation, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getUtilizationColor(totalAllocation)}`}>
                          {totalAllocation}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getUtilizationColor(100 - totalAllocation)}`}>
                        {available}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
                        {badge.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      {members.some(m => (m.availability?.currentAllocation || 0) > 100) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900 mb-2">Capacity Warnings</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                {members
                  .filter(m => (m.availability?.currentAllocation || 0) > 100)
                  .map(m => (
                    <li key={m.id}>
                      • Employee {m.employeeId} ({m.role}) is overallocated at {m.availability.currentAllocation}%
                    </li>
                  ))}
              </ul>
              <p className="text-sm text-amber-700 mt-2">
                Consider reducing their allocation or redistributing work to other team members.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCapacityDashboard;
