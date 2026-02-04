import React, { useEffect, useMemo, useState } from 'react';
import { Plus, MessageCircle, Search } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { crmAPI } from '../../api/crm.api';

const Communications = () => {
  const [communications, setCommunications] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'CALL',
    subject: '',
    notes: '',
    occurredAt: '',
    customerId: '',
    contactId: '',
    leadId: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [commsRes, customersRes, contactsRes, leadsRes] = await Promise.all([
        crmAPI.getCommunications(),
        crmAPI.getCustomers(),
        crmAPI.getContacts(),
        crmAPI.getLeads()
      ]);
      setCommunications(commsRes.data || []);
      setCustomers(customersRes.data || []);
      setContacts(contactsRes.data || []);
      setLeads(leadsRes.data || []);
    } catch (err) {
      setError('Failed to load communications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCommunications = useMemo(() => communications.filter(comm =>
    comm.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comm.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comm.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comm.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comm.lead?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [communications, searchTerm]);

  const resetForm = () => {
    setFormData({ type: 'CALL', subject: '', notes: '', occurredAt: '', customerId: '', contactId: '', leadId: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...formData,
        occurredAt: formData.occurredAt || undefined
      };
      await crmAPI.createCommunication(payload);
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      setError('Failed to save communication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Communication History</h1>
            <p className="text-primary-600 mt-1">Track customer touchpoints and interaction history</p>
          </div>
          <button className="btn-modern btn-primary flex items-center space-x-2" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            <span>Log Communication</span>
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
              placeholder="Search communications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
        </div>

        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">History ({filteredCommunications.length})</h2>
          </div>
          <div className="divide-y divide-primary-200">
            {loading ? (
              <div className="p-8"><LoadingSpinner /></div>
            ) : filteredCommunications.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No communications logged</p>
              </div>
            ) : (
              filteredCommunications.map(comm => (
                <div key={comm.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-primary-900">{comm.subject || 'Communication'}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{comm.type}</span>
                      </div>
                      <p className="text-sm text-primary-600 mt-2">{comm.notes}</p>
                      <div className="mt-3 text-xs text-primary-500">
                        {comm.customer?.name && <span>Customer: {comm.customer.name} · </span>}
                        {comm.contact?.name && <span>Contact: {comm.contact.name} · </span>}
                        {comm.lead?.name && <span>Lead: {comm.lead.name} · </span>}
                        <span>{new Date(comm.occurredAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="px-6 py-4 border-b border-primary-200">
                <h3 className="text-lg font-semibold text-primary-900">Log Communication</h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Type</label>
                    <select
                      className="input-modern mt-1"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="CALL">Call</option>
                      <option value="EMAIL">Email</option>
                      <option value="MEETING">Meeting</option>
                      <option value="NOTE">Note</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Occurred At</label>
                    <input
                      className="input-modern mt-1"
                      type="datetime-local"
                      value={formData.occurredAt}
                      onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700">Subject</label>
                  <input
                    className="input-modern mt-1"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700">Notes</label>
                  <textarea
                    className="input-modern mt-1"
                    rows="3"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Customer</label>
                    <select
                      className="input-modern mt-1"
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    >
                      <option value="">None</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Contact</label>
                    <select
                      className="input-modern mt-1"
                      value={formData.contactId}
                      onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                    >
                      <option value="">None</option>
                      {contacts.map(contact => (
                        <option key={contact.id} value={contact.id}>{contact.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Lead</label>
                    <select
                      className="input-modern mt-1"
                      value={formData.leadId}
                      onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                    >
                      <option value="">None</option>
                      {leads.map(lead => (
                        <option key={lead.id} value={lead.id}>{lead.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" className="btn-modern btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-modern btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Communication'}
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

export default Communications;
