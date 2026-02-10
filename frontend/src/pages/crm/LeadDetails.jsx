import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Building2,
  User,
  Target,
  Flame,
  TrendingUp,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CommunicationTimeline from '../../components/crm/CommunicationTimeline';
import QuickLogCommunication from '../../components/crm/QuickLogCommunication';
import { crmAPI } from '../../api/crm.api';

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadLeadData();
  }, [id]);

  const loadLeadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [leadRes, activitiesRes, communicationsRes] = await Promise.all([
        crmAPI.getLead(id),
        crmAPI.getActivities({ leadId: id }).catch(() => ({ data: [] })),
        crmAPI.getCommunications({ leadId: id }).catch(() => ({ data: [] }))
      ]);

      setLead(leadRes.data);
      setActivities(activitiesRes.data || []);
      setCommunications(communicationsRes.data || []);
    } catch (err) {
      setError('Failed to load lead details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const displayName = useMemo(() => {
    if (!lead) return '';
    if (lead.name) return lead.name;
    return [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Lead';
  }, [lead]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const config = {
      NEW: 'bg-blue-100 text-blue-700',
      CONTACTED: 'bg-emerald-100 text-emerald-700',
      QUALIFIED: 'bg-purple-100 text-purple-700',
      CONVERTED: 'bg-emerald-100 text-emerald-700',
      LOST: 'bg-red-100 text-red-700'
    };
    return config[status] || config.NEW;
  };

  const getRatingBadge = (rating) => {
    const config = {
      HOT: { bg: 'bg-red-100 text-red-700', icon: Flame },
      WARM: { bg: 'bg-orange-100 text-orange-700', icon: TrendingUp },
      COLD: { bg: 'bg-blue-100 text-blue-700', icon: Target }
    };
    const { bg, icon: Icon } = config[rating] || config.WARM;
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${bg}`}>
        <Icon className="w-3 h-3" />
        <span>{rating || 'WARM'}</span>
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const config = {
      HIGH: 'bg-red-100 text-red-700',
      MEDIUM: 'bg-yellow-100 text-yellow-700',
      LOW: 'bg-gray-100 text-gray-700'
    };
    return config[priority] || config.MEDIUM;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error || !lead) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Lead</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => navigate('/crm/leads')} className="btn-modern btn-primary">
            Back to Leads
          </button>
        </div>
      </Layout>
    );
  }

  const stats = {
    score: Number(lead.leadScore || 0),
    activities: activities.length,
    communications: communications.length
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'activities', label: `Activities (${activities.length})`, icon: CheckCircle },
    { id: 'communications', label: `Communications (${communications.length})`, icon: Mail },
    { id: 'timeline', label: 'Timeline', icon: Clock }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/crm/leads')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-primary-900">{displayName}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(lead.status)}`}>
                  {lead.status || 'NEW'}
                </span>
                {getRatingBadge(lead.rating)}
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(lead.priority)}`}>
                  {lead.priority || 'MEDIUM'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="btn-modern btn-secondary flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </button>
            <button className="btn-modern btn-secondary flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>Call</span>
            </button>
            <Link to={`/crm/leads/${id}/edit`} className="btn-modern btn-primary flex items-center space-x-2">
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Lead Score</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{stats.score}</p>
                <p className="text-xs text-primary-500 mt-1">Rating: {lead.rating || 'WARM'}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Activities</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{stats.activities}</p>
                <p className="text-xs text-primary-500 mt-1">Recent activity</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Communications</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{stats.communications}</p>
                <p className="text-xs text-primary-500 mt-1">Logged interactions</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 border-b border-primary-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-primary-500 hover:text-primary-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="modern-card-elevated p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="modern-card p-4">
                  <h3 className="text-sm font-semibold text-primary-700 mb-3">Lead Info</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-primary-400" />
                      <div>
                        <p className="text-xs text-primary-500">Name</p>
                        <p className="text-sm text-primary-900">{displayName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-4 h-4 text-primary-400" />
                      <div>
                        <p className="text-xs text-primary-500">Company</p>
                        <p className="text-sm text-primary-900">{lead.company || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-primary-400" />
                      <div>
                        <p className="text-xs text-primary-500">Email</p>
                        <p className="text-sm text-primary-900">{lead.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-primary-400" />
                      <div>
                        <p className="text-xs text-primary-500">Phone</p>
                        <p className="text-sm text-primary-900">{lead.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-primary-400" />
                      <div>
                        <p className="text-xs text-primary-500">First Contact</p>
                        <p className="text-sm text-primary-900">{formatDate(lead.firstContactDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modern-card p-4">
                  <h3 className="text-sm font-semibold text-primary-700 mb-3">Source Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-primary-500">Source</p>
                      <p className="text-primary-900">{lead.source || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-500">Campaign</p>
                      <p className="text-primary-900">{lead.campaign || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-500">Medium</p>
                      <p className="text-primary-900">{lead.medium || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-500">Referrer</p>
                      <p className="text-primary-900">{lead.referrer || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="modern-card p-4">
                  <h3 className="text-sm font-semibold text-primary-700 mb-3">Qualification</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-primary-500">Job Title</p>
                      <p className="text-primary-900">{lead.jobTitle || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-500">Status</p>
                      <p className="text-primary-900">{lead.status || 'NEW'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-500">Rating</p>
                      <p className="text-primary-900">{lead.rating || 'WARM'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-500">Priority</p>
                      <p className="text-primary-900">{lead.priority || 'MEDIUM'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-500">Budget</p>
                      <p className="text-primary-900">{lead.budget || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-500">Timeline</p>
                      <p className="text-primary-900">{lead.timeline || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-500">Authority</p>
                      <p className="text-primary-900">{lead.authority ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-500">Need</p>
                      <p className="text-primary-900">{lead.need || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="modern-card p-4">
                  <h3 className="text-sm font-semibold text-primary-700 mb-3">Notes</h3>
                  <p className="text-sm text-primary-800">{lead.notes || 'No notes added yet.'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-4">
              {activities.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No activities yet</p>
                </div>
              )}
              {activities.length > 0 && (
                <div className="space-y-3">
                  {activities.map(activity => (
                    <div key={activity.id} className="modern-card p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              activity.type === 'TASK' ? 'bg-blue-100 text-blue-700' :
                              activity.type === 'CALL' ? 'bg-emerald-100 text-emerald-700' :
                              activity.type === 'EMAIL' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {activity.type}
                            </span>
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              activity.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                              activity.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {activity.status}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-primary-900 mt-2">{activity.subject}</h4>
                          {activity.description && (
                            <p className="text-xs text-primary-600 mt-1">{activity.description}</p>
                          )}
                          {activity.dueDate && (
                            <div className="flex items-center space-x-1 mt-2">
                              <Calendar className="w-3 h-3 text-primary-400" />
                              <span className="text-xs text-primary-600">{formatDate(activity.dueDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'communications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary-900">Communications</h3>
                <QuickLogCommunication
                  leadId={id}
                  onSuccess={loadLeadData}
                  buttonText="Log Communication"
                  buttonClass="btn-modern btn-primary btn-sm flex items-center space-x-2"
                />
              </div>
              <CommunicationTimeline communications={communications} />
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary-900">Timeline</h3>
              {activities.length === 0 && communications.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No timeline events yet</p>
                </div>
              )}
              {activities.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-primary-700 mb-3">Activities</h4>
                  <div className="space-y-3">
                    {activities.slice(0, 5).map(activity => (
                      <div key={activity.id} className="modern-card p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                activity.type === 'TASK' ? 'bg-blue-100 text-blue-700' :
                                activity.type === 'CALL' ? 'bg-emerald-100 text-emerald-700' :
                                activity.type === 'EMAIL' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {activity.type}
                              </span>
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                activity.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                activity.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {activity.status}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-primary-900 mt-2">{activity.subject}</h4>
                            {activity.description && (
                              <p className="text-xs text-primary-600 mt-1">{activity.description}</p>
                            )}
                            {activity.dueDate && (
                              <div className="flex items-center space-x-1 mt-2">
                                <Calendar className="w-3 h-3 text-primary-400" />
                                <span className="text-xs text-primary-600">{formatDate(activity.dueDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {communications.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-primary-700 mb-3">Communications</h4>
                  <CommunicationTimeline communications={communications} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LeadDetails;
