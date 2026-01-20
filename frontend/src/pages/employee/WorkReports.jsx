import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../../api/employee.api.js';
import { FileText, Upload, Calendar, Clock, Plus, Target } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const WorkReports = () => {
  const [reports, setReports] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    workDate: new Date().toISOString().split('T')[0],
    hoursSpent: '',
    taskId: '',
    attachments: []
  });

  useEffect(() => {
    fetchReports();
    fetchTasks();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await employeeAPI.getWorkReports();
      setReports(response.data);
    } catch (err) {
      console.error('Failed to fetch work reports:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await employeeAPI.getTasks();
      setTasks(response.data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await employeeAPI.createWorkReport(formData);
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        workDate: new Date().toISOString().split('T')[0],
        hoursSpent: '',
        taskId: '',
        attachments: []
      });
      fetchReports();
    } catch (err) {
      console.error('Failed to create work report:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Work Reports</h1>
            <p className="text-primary-600 mt-1">Track and submit your daily work progress</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-modern btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Report</span>
          </button>
        </div>

        {/* Create Report Form */}
        {showForm && (
          <div className="modern-card-elevated p-6">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">Create Work Report</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Report Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="input-modern"
                    placeholder="Enter report title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Work Date *
                  </label>
                  <input
                    type="date"
                    name="workDate"
                    value={formData.workDate}
                    onChange={handleInputChange}
                    required
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Hours Spent
                  </label>
                  <input
                    type="number"
                    name="hoursSpent"
                    value={formData.hoursSpent}
                    onChange={handleInputChange}
                    step="0.5"
                    min="0"
                    max="24"
                    className="input-modern"
                    placeholder="Hours worked"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Related Task
                  </label>
                  <select
                    name="taskId"
                    value={formData.taskId}
                    onChange={handleInputChange}
                    className="input-modern"
                  >
                    <option value="">Select a task (optional)</option>
                    {tasks.map(task => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="input-modern"
                  placeholder="Describe the work completed, challenges faced, and outcomes achieved..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-modern btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modern btn-primary"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reports List */}
        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">My Work Reports</h2>
          </div>
          <div className="p-6">
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No work reports submitted yet.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Start by creating your first work report to track your progress.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border border-primary-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-primary-900">{report.title}</h3>
                          {report.task && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Task: {report.task.title}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-primary-600 mt-2">{report.description}</p>
                        <div className="flex items-center space-x-4 mt-3 text-sm text-primary-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(report.workDate).toLocaleDateString()}</span>
                          </div>
                          {report.hoursSpent && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{report.hoursSpent} hours</span>
                            </div>
                          )}
                          <span>Submitted: {new Date(report.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-gray-400" />
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

export default WorkReports;