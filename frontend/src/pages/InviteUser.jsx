import React, { useState } from 'react';
import { Mail, UserPlus, Copy, Check, Send, AlertCircle, ExternalLink } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { apiClient } from '../api/http';

const InviteUser = () => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'USER'
  });
  const [inviteLink, setInviteLink] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    console.log('Input changed:', e.target.name, e.target.value);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    if (!formData.email) {
      setError('Please enter an email address');
      return;
    }
    
    setError('');
    setSuccess('');
    setInviteLink('');
    setLoading(true);

    try {
      console.log('Sending invite request...');
      const response = await apiClient.post('/invites', formData);
      console.log('Invite response:', response);
      setInviteLink(response.data.inviteLink);
      setSuccess(`Invitation sent successfully to ${formData.email}`);
      setFormData({ email: '', role: 'USER' });
    } catch (err) {
      console.error('Invite error:', err);
      setError(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const testClick = () => {
    console.log('Test button clicked!');
    alert('Button is working!');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const roleOptions = [
    { value: 'USER', label: 'User', description: 'Basic access to the system' },
    { value: 'MANAGER', label: 'Manager', description: 'Department management access' },
    { value: 'ADMIN', label: 'Admin', description: 'Full system administration access' }
  ];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Invite User</h1>
          <p className="text-slate-600 mt-2">Send an invitation to join your organization</p>
        </div>

        {/* Test Button */}
        <button onClick={testClick} className="bg-red-500 text-white px-4 py-2 rounded">
          Test Button
        </button>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleInvite} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter user's email address"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role Assignment
              </label>
              <div className="space-y-3">
                {roleOptions.map((option) => (
                  <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={formData.role === option.value}
                      onChange={handleChange}
                      className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{option.label}</div>
                      <div className="text-sm text-slate-600">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          </div>
        )}

        {/* Invite Link Card */}
        {inviteLink && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Invitation Link Generated</h3>
            <p className="text-sm text-slate-600 mb-4">
              Share this link with the invited user. The link will expire in 24 hours.
            </p>
            
            <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <code className="text-sm text-slate-700 break-all flex-1 mr-4">
                  {inviteLink}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="flex-shrink-0 p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
              
              <a
                href={inviteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Link</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default InviteUser;
