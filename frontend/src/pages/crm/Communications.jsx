import React, { useEffect, useMemo, useState } from 'react';
import { 
  Plus, MessageCircle, Search, Phone, Mail, Calendar, 
  FileText, ArrowDownCircle, ArrowUpCircle, Clock, 
  CheckCircle, XCircle, MessageSquare, Filter, TrendingUp
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { crmAPI } from '../../api/crm.api';

const Communications = () => {
  const [communications, setCommunications] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'timeline'
  const [formData, setFormData] = useState({
    type: 'PHONE',
    direction: 'OUTBOUND',
    subject: '',
    notes: '',
    occurredAt: '',
    duration: 0,
    outcome: '',
    customerId: '',
    contactId: '',
    leadId: '',
    dealId: '',
    // Email fields
    emailFrom: '',
    emailTo: '',
    emailCc: '',
    // Meeting fields
    meetingLocation: '',
    meetingAttendees: []
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [commsRes, customersRes, contactsRes, leadsRes, dealsRes] = await Promise.all([
        crmAPI.getCommunications(),
        crmAPI.getCustomers(),
        crmAPI.getContacts(),
        crmAPI.getLeads(),
        crmAPI.getDeals()
      ]);
      setCommunications(commsRes.data || []);
      setCustomers(customersRes.data || []);
      setContacts(contactsRes.data || []);
      setLeads(leadsRes.data || []);
      setDeals(dealsRes.data || []);
    } catch (err) {
      setError('Failed to load communications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCommunications = useMemo(() => {
    let filtered = communications.filter(comm =>
      comm.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.lead?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterType) {
      filtered = filtered.filter(comm => comm.type === filterType);
    }
    if (filterDirection) {
      filtered = filtered.filter(comm => comm.direction === filterDirection);
    }
    if (filterOutcome) {
      filtered = filtered.filter(comm => comm.outcome === filterOutcome);
    }

    return filtered.sort((a, b) => new Date(b.occurredAt || b.createdAt) - new Date(a.occurredAt || a.createdAt));
  }, [communications, searchTerm, filterType, filterDirection, filterOutcome]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = communications.length;
    const byType = {
      PHONE: communications.filter(c => c.type === 'PHONE').length,
      EMAIL: communications.filter(c => c.type === 'EMAIL').length,
      MEETING: communications.filter(c => c.type === 'MEETING').length,
      NOTE: communications.filter(c => c.type === 'NOTE').length
    };
    const successful = communications.filter(c => c.outcome === 'SUCCESSFUL').length;
    const avgDuration = communications.filter(c => c.duration).reduce((sum, c) => sum + c.duration, 0) / 
                       (communications.filter(c => c.duration).length || 1);
    
    return { total, byType, successful, avgDuration };
  }, [communications]);

  const resetForm = () => {
    setFormData({
      type: 'PHONE',
      direction: 'OUTBOUND',
      subject: '',
      notes: '',
      occurredAt: '',
      duration: 0,
      outcome: '',
      customerId: '',
      contactId: '',
      leadId: '',
      dealId: '',
      emailFrom: '',
      emailTo: '',
      emailCc: '',
      meetingLocation: '',
      meetingAttendees: []
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        type: formData.type,
        direction: formData.direction || undefined,
        subject: formData.subject || undefined,
        notes: formData.notes,
        occurredAt: formData.occurredAt || new Date().toISOString(),
        duration: formData.duration ? Number(formData.duration) : undefined,
        outcome: formData.outcome || undefined,
        customerId: formData.customerId || undefined,
        contactId: formData.contactId || undefined,
        leadId: formData.leadId || undefined,
        dealId: formData.dealId || undefined,
      };

      // Add type-specific fields
      if (formData.type === 'EMAIL') {
        payload.emailFrom = formData.emailFrom || undefined;
        payload.emailTo = formData.emailTo || undefined;
        payload.emailCc = formData.emailCc || undefined;
      }
      if (formData.type === 'MEETING') {
        payload.meetingLocation = formData.meetingLocation || undefined;
        payload.meetingAttendees = formData.meetingAttendees || [];
      }

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

  const getTypeIcon = (type) => {
    const icons = {
      PHONE: Phone,
      EMAIL: Mail,
      MEETING: Calendar,
      NOTE: FileText,
      SMS: MessageSquare,
      CHAT: MessageCircle
    };
    return icons[type] || MessageCircle;
  };

  const getTypeColor = (type) => {
    const colors = {
      PHONE: 'bg-blue-100 text-blue-700',
      EMAIL: 'bg-purple-100 text-purple-700',
      MEETING: 'bg-emerald-100 text-emerald-700',
      NOTE: 'bg-gray-100 text-gray-700',
      SMS: 'bg-orange-100 text-orange-700',
      CHAT: 'bg-pink-100 text-pink-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getOutcomeBadge = (outcome) => {
    if (!outcome) return null;
    const config = {
      SUCCESSFUL: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
      NO_ANSWER: { color: 'bg-yellow-100 text-yellow-700', icon: XCircle },
      LEFT_MESSAGE: { color: 'bg-blue-100 text-blue-700', icon: MessageSquare },
      FOLLOW_UP_REQUIRED: { color: 'bg-orange-100 text-orange-700', icon: Clock }
    };
    return config[outcome] || { color: 'bg-gray-100 text-gray-700', icon: MessageCircle };
  };

  const formatDuration = (minutes) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Total</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Calls</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{stats.byType.PHONE}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <Phone className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Emails</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{stats.byType.EMAIL}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Meetings</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{stats.byType.MEETING}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="modern-card-elevated p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search communications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern pl-10"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-modern"
              >
                <option value="">All Types</option>
                <option value="PHONE">Phone</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
                <option value="NOTE">Note</option>
                <option value="SMS">SMS</option>
              </select>
              <select
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value)}
                className="input-modern"
              >
                <option value="">All Directions</option>
                <option value="INBOUND">Inbound</option>
                <option value="OUTBOUND">Outbound</option>
              </select>
              <select
                value={filterOutcome}
                onChange={(e) => setFilterOutcome(e.target.value)}
                className="input-modern"
              >
                <option value="">All Outcomes</option>
                <option value="SUCCESSFUL">Successful</option>
                <option value="NO_ANSWER">No Answer</option>
                <option value="LEFT_MESSAGE">Left Message</option>
                <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
              </select>
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'timeline' : 'list')}
                className="btn-modern btn-secondary flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>{viewMode === 'list' ? 'Timeline' : 'List'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Communications Display */}
        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">
              {viewMode === 'list' ? 'History' : 'Timeline'} ({filteredCommunications.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="p-8"><LoadingSpinner /></div>
          ) : filteredCommunications.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No communications found</p>
            </div>
          ) : viewMode === 'timeline' ? (
            /* Timeline View */
            <div className="p-6">
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-primary-200"></div>
                <div className="space-y-6">
                  {filteredCommunications.map(comm => {
                    const TypeIcon = getTypeIcon(comm.type);
                    const outcomeBadge = getOutcomeBadge(comm.outcome);
                    const OutcomeIcon = outcomeBadge?.icon;

                    return (
                      <div key={comm.id} className="relative pl-14">
                        <div className={`absolute left-3 top-2 w-6 h-6 rounded-full flex items-center justify-center border-4 border-white ${getTypeColor(comm.type)}`}>
                          <TypeIcon className="w-3 h-3" />
                        </div>
                        <div className="modern-card p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(comm.type)}`}>
                                <TypeIcon className="w-3 h-3" />
                                <span>{comm.type}</span>
                              </span>
                              {comm.direction && (
                                <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  comm.direction === 'INBOUND' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {comm.direction === 'INBOUND' ? <ArrowDownCircle className="w-3 h-3" /> : <ArrowUpCircle className="w-3 h-3" />}
                                  <span>{comm.direction}</span>
                                </span>
                              )}
                              {comm.outcome && OutcomeIcon && (
                                <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${outcomeBadge.color}`}>
                                  <OutcomeIcon className="w-3 h-3" />
                                  <span>{comm.outcome.replace('_', ' ')}</span>
                                </span>
                              )}
                              {comm.duration > 0 && (
                                <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDuration(comm.duration)}</span>
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-primary-500 whitespace-nowrap">
                              {new Date(comm.occurredAt || comm.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-primary-900 mb-1">
                            {comm.subject || `${comm.type} Communication`}
                          </h4>
                          <p className="text-sm text-primary-600 mb-3">{comm.notes}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-primary-500">
                            {comm.customer && (
                              <span className="inline-flex items-center px-2 py-1 bg-blue-50 rounded">
                                Customer: {comm.customer.name}
                              </span>
                            )}
                            {comm.contact && (
                              <span className="inline-flex items-center px-2 py-1 bg-purple-50 rounded">
                                Contact: {comm.contact.name}
                              </span>
                            )}
                            {comm.lead && (
                              <span className="inline-flex items-center px-2 py-1 bg-orange-50 rounded">
                                Lead: {comm.lead.name}
                              </span>
                            )}
                            {comm.deal && (
                              <span className="inline-flex items-center px-2 py-1 bg-emerald-50 rounded">
                                Deal: {comm.deal.name}
                              </span>
                            )}
                          </div>
                          {comm.type === 'EMAIL' && (comm.emailFrom || comm.emailTo) && (
                            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-primary-600">
                              {comm.emailFrom && <div>From: {comm.emailFrom}</div>}
                              {comm.emailTo && <div>To: {comm.emailTo}</div>}
                              {comm.emailCc && <div>Cc: {comm.emailCc}</div>}
                            </div>
                          )}
                          {comm.type === 'MEETING' && (comm.meetingLocation || comm.meetingAttendees?.length > 0) && (
                            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-primary-600">
                              {comm.meetingLocation && <div>Location: {comm.meetingLocation}</div>}
                              {comm.meetingAttendees?.length > 0 && (
                                <div>Attendees: {comm.meetingAttendees.join(', ')}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="divide-y divide-primary-200">
              {filteredCommunications.map(comm => {
                const TypeIcon = getTypeIcon(comm.type);
                const outcomeBadge = getOutcomeBadge(comm.outcome);
                const OutcomeIcon = outcomeBadge?.icon;

                return (
                  <div key={comm.id} className="p-6 hover:bg-primary-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 flex-wrap mb-2">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(comm.type)}`}>
                            <TypeIcon className="w-3 h-3" />
                            <span>{comm.type}</span>
                          </span>
                          {comm.direction && (
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                              comm.direction === 'INBOUND' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {comm.direction === 'INBOUND' ? <ArrowDownCircle className="w-3 h-3" /> : <ArrowUpCircle className="w-3 h-3" />}
                              <span>{comm.direction}</span>
                            </span>
                          )}
                          {comm.outcome && OutcomeIcon && (
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${outcomeBadge.color}`}>
                              <OutcomeIcon className="w-3 h-3" />
                              <span>{comm.outcome.replace('_', ' ')}</span>
                            </span>
                          )}
                          {comm.duration > 0 && (
                            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              <Clock className="w-3 h-3" />
                              <span>{formatDuration(comm.duration)}</span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-primary-900">
                          {comm.subject || `${comm.type} Communication`}
                        </h4>
                        <p className="text-sm text-primary-600 mt-2">{comm.notes}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-primary-500">
                          {comm.customer?.name && <span>Customer: {comm.customer.name}</span>}
                          {comm.contact?.name && <span>· Contact: {comm.contact.name}</span>}
                          {comm.lead?.name && <span>· Lead: {comm.lead.name}</span>}
                          {comm.deal?.name && <span>· Deal: {comm.deal.name}</span>}
                          <span>· {new Date(comm.occurredAt || comm.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Enhanced Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-primary-200 sticky top-0 bg-white">
                <h3 className="text-lg font-semibold text-primary-900">Log Communication</h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <h4 className="text-sm font-semibold text-primary-900 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-700">Type *</label>
                      <select
                        className="input-modern mt-1"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        required
                      >
                        <option value="PHONE">Phone Call</option>
                        <option value="EMAIL">Email</option>
                        <option value="MEETING">Meeting</option>
                        <option value="NOTE">Note</option>
                        <option value="SMS">SMS</option>
                        <option value="CHAT">Chat</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700">Direction</label>
                      <select
                        className="input-modern mt-1"
                        value={formData.direction}
                        onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                      >
                        <option value="">Not specified</option>
                        <option value="INBOUND">Inbound</option>
                        <option value="OUTBOUND">Outbound</option>
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
                    <div>
                      <label className="block text-sm font-medium text-primary-700">Duration (minutes)</label>
                      <input
                        className="input-modern mt-1"
                        type="number"
                        min="0"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>

                {/* Subject & Notes */}
                <div>
                  <h4 className="text-sm font-semibold text-primary-900 mb-3">Details</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-700">Subject</label>
                      <input
                        className="input-modern mt-1"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Brief summary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700">Notes *</label>
                      <textarea
                        className="input-modern mt-1"
                        rows="4"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Detailed notes about this communication"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700">Outcome</label>
                      <select
                        className="input-modern mt-1"
                        value={formData.outcome}
                        onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                      >
                        <option value="">Not specified</option>
                        <option value="SUCCESSFUL">Successful</option>
                        <option value="NO_ANSWER">No Answer</option>
                        <option value="LEFT_MESSAGE">Left Message</option>
                        <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Email-specific fields */}
                {formData.type === 'EMAIL' && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-primary-900 mb-3 flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-purple-600" />
                      <span>Email Details</span>
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-primary-700">From</label>
                        <input
                          className="input-modern mt-1"
                          type="email"
                          value={formData.emailFrom}
                          onChange={(e) => setFormData({ ...formData, emailFrom: e.target.value })}
                          placeholder="sender@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary-700">To</label>
                        <input
                          className="input-modern mt-1"
                          type="email"
                          value={formData.emailTo}
                          onChange={(e) => setFormData({ ...formData, emailTo: e.target.value })}
                          placeholder="recipient@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary-700">Cc</label>
                        <input
                          className="input-modern mt-1"
                          type="text"
                          value={formData.emailCc}
                          onChange={(e) => setFormData({ ...formData, emailCc: e.target.value })}
                          placeholder="cc@example.com (comma-separated for multiple)"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Meeting-specific fields */}
                {formData.type === 'MEETING' && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-primary-900 mb-3 flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>Meeting Details</span>
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-primary-700">Location</label>
                        <input
                          className="input-modern mt-1"
                          value={formData.meetingLocation}
                          onChange={(e) => setFormData({ ...formData, meetingLocation: e.target.value })}
                          placeholder="Meeting room, video call link, etc."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary-700">Attendees</label>
                        <input
                          className="input-modern mt-1"
                          value={formData.meetingAttendees.join(', ')}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            meetingAttendees: e.target.value.split(',').map(a => a.trim()).filter(a => a)
                          })}
                          placeholder="John Doe, Jane Smith (comma-separated)"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Related Records */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-primary-900 mb-3">Related To</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div>
                      <label className="block text-sm font-medium text-primary-700">Deal</label>
                      <select
                        className="input-modern mt-1"
                        value={formData.dealId}
                        onChange={(e) => setFormData({ ...formData, dealId: e.target.value })}
                      >
                        <option value="">None</option>
                        {deals.map(deal => (
                          <option key={deal.id} value={deal.id}>{deal.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button 
                    type="button" 
                    className="btn-modern btn-secondary" 
                    onClick={() => { setShowModal(false); resetForm(); }}
                  >
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
