import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Target, Edit, CheckCircle } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { crmAPI } from '../../api/crm.api';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: '',
    status: 'NEW',
    notes: ''
  });

  const loadLeads = async () => {
    setLoading(true);
    try {
      const response = await crmAPI.getLeads();
      setLeads(response.data || []);
    } catch (err) {
      setError('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => leads.filter(lead =>
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.source?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [leads, searchTerm]);

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', company: '', source: '', status: 'NEW', notes: '' });
    setEditingLead(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editingLead) {
        await crmAPI.updateLead(editingLead.id, formData);
      } else {
        await crmAPI.createLead(formData);
      }
      setShowModal(false);
      resetForm();
      loadLeads();
    } catch (err) {
      setError('Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      source: lead.source || '',
      status: lead.status || 'NEW',
      notes: lead.notes || ''
    });
    setShowModal(true);
  };

  const handleConvert = async (leadId) => {
    if (!window.confirm('Convert this lead to a customer?')) return;
    setLoading(true);
    try {
      await crmAPI.convertLead(leadId);
      loadLeads();
    } catch (err) {
      setError('Failed to convert lead');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    const config = {
      NEW: 'bg-blue-100 text-blue-700',
      QUALIFIED: 'bg-emerald-100 text-emerald-700',
      CONVERTED: 'bg-purple-100 text-purple-700',
      LOST: 'bg-red-100 text-red-700'
    };
    return config[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Lead Tracking</h1>
            <p className="text-primary-600 mt-1">Track leads, qualify opportunities, and convert prospects</p>
          </div>
          <button className="btn-modern btn-primary flex items-center space-x-2" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="modern-card-elevated p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads by name, company, or source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
        </div>

        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">Leads ({filteredLeads.length})</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8"><LoadingSpinner /></div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No leads found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Lead</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-primary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-primary-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Target className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-primary-900">{lead.name}</div>
                            <div className="text-xs text-primary-500">{lead.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-primary-700">{lead.company || '—'}</td>
                      <td className="px-6 py-4 text-sm text-primary-700">{lead.source || '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusBadge(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => handleEdit(lead)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Edit className="w-4 h-4" />
                          </button>
                          {lead.status !== 'CONVERTED' && (
                            <button onClick={() => handleConvert(lead.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="px-6 py-4 border-b border-primary-200">
                <h3 className="text-lg font-semibold text-primary-900">
                  {editingLead ? 'Edit Lead' : 'Add Lead'}
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Name</label>
                    <input
                      className="input-modern mt-1"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Company</label>
                    <input
                      className="input-modern mt-1"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Email</label>
                    <input
                      className="input-modern mt-1"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Phone</label>
                    <input
                      className="input-modern mt-1"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Source</label>
                    <input
                      className="input-modern mt-1"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Status</label>
                    <select
                      className="input-modern mt-1"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="NEW">New</option>
                      <option value="QUALIFIED">Qualified</option>
                      <option value="CONVERTED">Converted</option>
                      <option value="LOST">Lost</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700">Notes</label>
                  <textarea
                    className="input-modern mt-1"
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" className="btn-modern btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-modern btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Lead'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Leads;
