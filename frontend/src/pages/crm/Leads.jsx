import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Target, Edit, CheckCircle, Flame, TrendingUp, Filter, DollarSign, Users, Clock, Zap } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { crmAPI } from '../../api/crm.api';

const LEAD_RATINGS = ['HOT', 'WARM', 'COLD'];
const LEAD_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [convertingLead, setConvertingLead] = useState(null);
  const [filterRating, setFilterRating] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [minScore, setMinScore] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    source: '',
    campaign: '',
    medium: '',
    referrer: '',
    status: 'NEW',
    leadScore: 50,
    rating: 'WARM',
    priority: 'MEDIUM',
    budget: '',
    timeline: '',
    authority: false,
    need: '',
    notes: ''
  });

  const [convertData, setConvertData] = useState({
    createDeal: false,
    dealName: '',
    dealAmount: 0,
    pipelineId: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        ...(filterRating && { rating: filterRating }),
        ...(filterStatus && { status: filterStatus }),
        ...(minScore && { minScore: Number(minScore) })
      };
      
      const [leadsRes, customersRes, pipelinesRes] = await Promise.all([
        crmAPI.getLeads(params),
        crmAPI.getCustomers().catch(() => ({ data: [] })),
        crmAPI.getPipelines({ active: true }).catch(() => ({ data: [] }))
      ]);
      
      setLeads(leadsRes.data || []);
      setCustomers(customersRes.data || []);
      setPipelines(pipelinesRes.data || []);
    } catch (err) {
      setError('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterRating, filterStatus, minScore]);

  const filteredLeads = useMemo(() => leads.filter(lead =>
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [leads, searchTerm]);

  const resetForm = () => {
    setFormData({
      name: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      jobTitle: '',
      source: '',
      campaign: '',
      medium: '',
      referrer: '',
      status: 'NEW',
      leadScore: 50,
      rating: 'WARM',
      priority: 'MEDIUM',
      budget: '',
      timeline: '',
      authority: false,
      need: '',
      notes: ''
    });
    setEditingLead(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...formData,
        leadScore: Number(formData.leadScore)
      };
      
      if (editingLead) {
        await crmAPI.updateLead(editingLead.id, payload);
      } else {
        await crmAPI.createLead(payload);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || '',
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      jobTitle: lead.jobTitle || '',
      source: lead.source || '',
      campaign: lead.campaign || '',
      medium: lead.medium || '',
      referrer: lead.referrer || '',
      status: lead.status || 'NEW',
      leadScore: lead.leadScore || 50,
      rating: lead.rating || 'WARM',
      priority: lead.priority || 'MEDIUM',
      budget: lead.budget || '',
      timeline: lead.timeline || '',
      authority: lead.authority || false,
      need: lead.need || '',
      notes: lead.notes || ''
    });
    setShowModal(true);
  };

  const handleConvertClick = (lead) => {
    setConvertingLead(lead);
    setConvertData({
      createDeal: false,
      dealName: `${lead.company || lead.name} Deal`,
      dealAmount: 0,
      pipelineId: pipelines.find(p => p.isDefault)?.id || pipelines[0]?.id || ''
    });
    setShowConvertModal(true);
  };

  const handleConvert = async () => {
    if (!convertingLead) return;
    setLoading(true);
    try {
      const payload = convertData.createDeal ? {
        dealName: convertData.dealName,
        dealAmount: Number(convertData.dealAmount),
        pipelineId: convertData.pipelineId
      } : {};
      
      await crmAPI.convertLead(convertingLead.id, payload);
      setShowConvertModal(false);
      setConvertingLead(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to convert lead');
    } finally {
      setLoading(false);
    }
  };

  const getRatingBadge = (rating) => {
    const config = {
      HOT: { bg: 'bg-red-100', text: 'text-red-700', icon: Flame },
      WARM: { bg: 'bg-orange-100', text: 'text-orange-700', icon: TrendingUp },
      COLD: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Target }
    };
    const { bg, text, icon: Icon } = config[rating] || config.WARM;
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        <Icon className="w-3 h-3" />
        <span>{rating}</span>
      </span>
    );
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-emerald-600 bg-emerald-100';
    if (score >= 50) return 'text-blue-600 bg-blue-100';
    if (score >= 25) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const statusBadge = (status) => {
    const config = {
      NEW: 'bg-blue-100 text-blue-700',
      CONTACTED: 'bg-purple-100 text-purple-700',
      QUALIFIED: 'bg-emerald-100 text-emerald-700',
      CONVERTED: 'bg-green-100 text-green-700',
      LOST: 'bg-red-100 text-red-700'
    };
    return config[status] || 'bg-gray-100 text-gray-700';
  };

  const stats = useMemo(() => {
    const hot = leads.filter(l => l.rating === 'HOT').length;
    const qualified = leads.filter(l => l.status === 'QUALIFIED').length;
    const avgScore = leads.length > 0 ? leads.reduce((sum, l) => sum + (l.leadScore || 0), 0) / leads.length : 0;
    const highScore = leads.filter(l => (l.leadScore || 0) >= 75).length;
    return { hot, qualified, avgScore: avgScore.toFixed(0), highScore };
  }, [leads]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Lead Management</h1>
            <p className="text-primary-600 mt-1">Track, score, qualify, and convert leads</p>
          </div>
          <button className="btn-modern btn-primary flex items-center space-x-2" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Leads', value: leads.length, icon: Target, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Hot Leads', value: stats.hot, icon: Flame, bg: 'bg-red-50', color: 'text-red-600' },
            { label: 'Qualified', value: stats.qualified, icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Avg Score', value: stats.avgScore, icon: TrendingUp, bg: 'bg-purple-50', color: 'text-purple-600' }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="modern-card-elevated p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-primary-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="modern-card-elevated p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern pl-10"
              />
            </div>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="input-modern"
            >
              <option value="">All Ratings</option>
              {LEAD_RATINGS.map(rating => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-modern"
            >
              <option value="">All Status</option>
              {LEAD_STATUSES.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Min Score (0-100)"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="input-modern"
              min="0"
              max="100"
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Qualification</th>
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
                            <Link to={`/crm/leads/${lead.id}`} className="text-sm font-medium text-primary-900 hover:underline">
                              {lead.name}
                            </Link>
                            <div className="text-xs text-primary-500">{lead.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-primary-700">{lead.company || '—'}</div>
                        {lead.jobTitle && (
                          <div className="text-xs text-primary-500">{lead.jobTitle}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className={`text-lg font-bold px-2 py-1 rounded ${getScoreColor(lead.leadScore || 0)}`}>
                            {lead.leadScore || 0}
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full"
                              style={{ width: `${lead.leadScore || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {getRatingBadge(lead.rating || 'WARM')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusBadge(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-xs">
                          {lead.budget && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded" title="Budget">
                              <DollarSign className="w-3 h-3" />
                            </span>
                          )}
                          {lead.authority && (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded" title="Authority">
                              <Users className="w-3 h-3" />
                            </span>
                          )}
                          {lead.need && (
                            <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded" title="Need">
                              <Zap className="w-3 h-3" />
                            </span>
                          )}
                          {lead.timeline && (
                            <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 rounded" title="Timeline">
                              <Clock className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => handleEdit(lead)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Edit className="w-4 h-4" />
                          </button>
                          {lead.status !== 'CONVERTED' && (
                            <button onClick={() => handleConvertClick(lead)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
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

        {/* Create/Edit Lead Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-primary-900">
                  {editingLead ? 'Edit Lead' : 'New Lead'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-primary-800 mb-3 uppercase tracking-wide">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="input-modern"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="input-modern"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input-modern"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input-modern"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="input-modern"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="input-modern"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                      <input
                        type="text"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        className="input-modern"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                      <input
                        type="text"
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        className="input-modern"
                        placeholder="e.g., Website, Referral"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="input-modern"
                      >
                        {LEAD_STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-primary-800 mb-3 uppercase tracking-wide">Scoring & Qualification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lead Score: <span className={`font-bold px-2 py-1 rounded ${getScoreColor(formData.leadScore)}`}>{formData.leadScore}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.leadScore}
                        onChange={(e) => setFormData({ ...formData, leadScore: e.target.value })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Cold (0)</span>
                        <span>Average (50)</span>
                        <span>Hot (100)</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                      <select
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                        className="input-modern"
                      >
                        {LEAD_RATINGS.map(rating => (
                          <option key={rating} value={rating}>{rating}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="input-modern"
                      >
                        {LEAD_PRIORITIES.map(priority => (
                          <option key={priority} value={priority}>{priority}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-primary-800 mb-3 uppercase tracking-wide">BANT Qualification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                      <input
                        type="text"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="input-modern"
                        placeholder="$50k - $100k"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                      <input
                        type="text"
                        value={formData.timeline}
                        onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                        className="input-modern"
                        placeholder="Q2 2024, Next Month, etc."
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="authority"
                        checked={formData.authority}
                        onChange={(e) => setFormData({ ...formData, authority: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="authority" className="ml-2 text-sm font-medium text-gray-700">
                        Has Decision Authority
                      </label>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Need / Pain Point</label>
                      <textarea
                        value={formData.need}
                        onChange={(e) => setFormData({ ...formData, need: e.target.value })}
                        className="input-modern"
                        rows={2}
                        placeholder="What problem are they trying to solve?"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-primary-800 mb-3 uppercase tracking-wide">Campaign Tracking</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
                      <input
                        type="text"
                        value={formData.campaign}
                        onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                        className="input-modern"
                        placeholder="Summer 2024"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medium</label>
                      <input
                        type="text"
                        value={formData.medium}
                        onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                        className="input-modern"
                        placeholder="Email, Social, PPC"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Referrer</label>
                      <input
                        type="text"
                        value={formData.referrer}
                        onChange={(e) => setFormData({ ...formData, referrer: e.target.value })}
                        className="input-modern"
                        placeholder="Partner, Customer, etc."
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-modern"
                    rows={4}
                    placeholder="Additional notes about this lead..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="btn-modern btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="btn-modern btn-primary">
                    {loading ? 'Saving...' : editingLead ? 'Update Lead' : 'Create Lead'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Convert Lead Modal */}
        {showConvertModal && convertingLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-primary-900">Convert Lead to Customer</h2>
                <p className="text-sm text-primary-600 mt-1">
                  Converting: <span className="font-medium">{convertingLead.name}</span>
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    This will create a customer and a primary contact. You can optionally create a deal as well.
                  </p>
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="createDeal"
                    checked={convertData.createDeal}
                    onChange={(e) => setConvertData({ ...convertData, createDeal: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                  />
                  <label htmlFor="createDeal" className="ml-2 text-sm font-medium text-gray-700">
                    Create a deal during conversion
                  </label>
                </div>

                {convertData.createDeal && (
                  <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deal Name</label>
                      <input
                        type="text"
                        value={convertData.dealName}
                        onChange={(e) => setConvertData({ ...convertData, dealName: e.target.value })}
                        className="input-modern"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deal Amount</label>
                      <input
                        type="number"
                        value={convertData.dealAmount}
                        onChange={(e) => setConvertData({ ...convertData, dealAmount: e.target.value })}
                        className="input-modern"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline</label>
                      <select
                        value={convertData.pipelineId}
                        onChange={(e) => setConvertData({ ...convertData, pipelineId: e.target.value })}
                        className="input-modern"
                      >
                        <option value="">Select Pipeline</option>
                        {pipelines.map(pipeline => (
                          <option key={pipeline.id} value={pipeline.id}>
                            {pipeline.name} {pipeline.isDefault ? '(Default)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowConvertModal(false); setConvertingLead(null); }}
                    className="btn-modern btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConvert}
                    disabled={loading || (convertData.createDeal && !convertData.pipelineId)}
                    className="btn-modern btn-primary flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{loading ? 'Converting...' : 'Convert Lead'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Leads;
