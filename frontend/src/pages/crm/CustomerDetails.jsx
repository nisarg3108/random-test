import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Mail, Phone, MapPin, Globe, DollarSign, Calendar, 
  User, Users, Briefcase, FileText, Paperclip, MessageSquare, 
  BarChart3, TrendingUp, Clock, CheckCircle, AlertCircle, Plus, Target
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CommunicationTimeline from '../../components/crm/CommunicationTimeline';
import QuickLogCommunication from '../../components/crm/QuickLogCommunication';
import { crmAPI } from '../../api/crm.api';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [notes, setNotes] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCustomerData();
  }, [id]);

  const loadCustomerData = async () => {
    setLoading(true);
    setError('');
    try {
      const [customerRes, contactsRes, dealsRes, activitiesRes, communicationsRes] = await Promise.all([
        crmAPI.getCustomer(id),
        crmAPI.getContacts({ customerId: id }).catch(() => ({ data: [] })),
        crmAPI.getDeals({ customerId: id }).catch(() => ({ data: [] })),
        crmAPI.getActivities({ customerId: id }).catch(() => ({ data: [] })),
        crmAPI.getCommunications({ customerId: id }).catch(() => ({ data: [] }))
      ]);

      setCustomer(customerRes.data);
      setContacts(contactsRes.data || []);
      setDeals(dealsRes.data || []);
      setActivities(activitiesRes.data || []);
      setCommunications(communicationsRes.data || []);
    } catch (err) {
      setError('Failed to load customer details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatAddress = (address) => {
    if (!address || !address.street) return 'No address';
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`;
  };

  const getStatusBadge = (status) => {
    const config = {
      ACTIVE: 'bg-emerald-100 text-emerald-700',
      INACTIVE: 'bg-gray-100 text-gray-700',
      CHURNED: 'bg-red-100 text-red-700',
      PROSPECTIVE: 'bg-blue-100 text-blue-700'
    };
    return config[status] || config.ACTIVE;
  };

  const getCategoryBadge = (category) => {
    const config = {
      CUSTOMER: 'bg-emerald-100 text-emerald-700',
      PARTNER: 'bg-blue-100 text-blue-700',
      PROSPECT: 'bg-orange-100 text-orange-700'
    };
    return config[category] || config.CUSTOMER;
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

  if (error || !customer) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Customer</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => navigate('/crm/customers')} className="btn-modern btn-primary">
            Back to Customers
          </button>
        </div>
      </Layout>
    );
  }

  const stats = {
    totalDeals: deals.length,
    activeDeals: deals.filter(d => d.status === 'OPEN').length,
    totalValue: deals.reduce((sum, d) => sum + (d.amount || 0), 0),
    wonDeals: deals.filter(d => d.status === 'WON').length,
    contacts: contacts.length,
    activities: activities.length,
    openActivities: activities.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length,
    communications: communications.length
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'contacts', label: `Contacts (${contacts.length})`, icon: Users },
    { id: 'deals', label: `Deals (${deals.length})`, icon: Briefcase },
    { id: 'activities', label: `Activities (${activities.length})`, icon: CheckCircle },
    { id: 'communications', label: `Communications (${communications.length})`, icon: MessageSquare },
    { id: 'timeline', label: 'Timeline', icon: Clock }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/crm/customers')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-primary-900">{customer.name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(customer.status)}`}>
                  {customer.status}
                </span>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadge(customer.category)}`}>
                  {customer.category}
                </span>
                {customer.type && (
                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {customer.type}
                  </span>
                )}
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
            <button onClick={() => navigate(`/crm/customers/${id}/edit`)} className="btn-modern btn-primary flex items-center space-x-2">
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Total Deals</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{stats.totalDeals}</p>
                <p className="text-xs text-primary-500 mt-1">{stats.activeDeals} active</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Total Value</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{formatCurrency(stats.totalValue)}</p>
                <p className="text-xs text-primary-500 mt-1">{stats.wonDeals} won</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Contacts</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{stats.contacts}</p>
                <p className="text-xs text-primary-500 mt-1">Total contacts</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Activities</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{stats.activities}</p>
                <p className="text-xs text-primary-500 mt-1">{stats.openActivities} open</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="modern-card-elevated">
          <div className="border-b border-primary-200">
            <div className="flex space-x-1 overflow-x-auto px-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary-900 flex items-center space-x-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      <span>Company Information</span>
                    </h3>
                    <div className="space-y-3">
                      {customer.industry && (
                        <div className="flex justify-between">
                          <span className="text-sm text-primary-600">Industry</span>
                          <span className="text-sm font-medium text-primary-900">{customer.industry}</span>
                        </div>
                      )}
                      {customer.companySize && (
                        <div className="flex justify-between">
                          <span className="text-sm text-primary-600">Company Size</span>
                          <span className="text-sm font-medium text-primary-900">{customer.companySize}</span>
                        </div>
                      )}
                      {customer.annualRevenue && (
                        <div className="flex justify-between">
                          <span className="text-sm text-primary-600">Annual Revenue</span>
                          <span className="text-sm font-medium text-primary-900">
                            {formatCurrency(customer.annualRevenue)} {customer.currencyCode}
                          </span>
                        </div>
                      )}
                      {customer.website && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-primary-600">Website</span>
                          <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline flex items-center space-x-1">
                            <Globe className="w-3 h-3" />
                            <span>Visit Website</span>
                          </a>
                        </div>
                      )}
                      {customer.source && (
                        <div className="flex justify-between">
                          <span className="text-sm text-primary-600">Source</span>
                          <span className="text-sm font-medium text-primary-900">{customer.source}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary-900 flex items-center space-x-2">
                      <Phone className="w-5 h-5 text-emerald-600" />
                      <span>Contact Information</span>
                    </h3>
                    <div className="space-y-3">
                      {customer.primaryEmail && (
                        <div className="flex items-center space-x-3">
                          <Mail className="w-4 h-4 text-primary-400" />
                          <div>
                            <p className="text-xs text-primary-600">Email</p>
                            <a href={`mailto:${customer.primaryEmail}`} className="text-sm font-medium text-blue-600 hover:underline">
                              {customer.primaryEmail}
                            </a>
                          </div>
                        </div>
                      )}
                      {customer.primaryPhone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="w-4 h-4 text-primary-400" />
                          <div>
                            <p className="text-xs text-primary-600">Phone</p>
                            <a href={`tel:${customer.primaryPhone}`} className="text-sm font-medium text-blue-600 hover:underline">
                              {customer.primaryPhone}
                            </a>
                          </div>
                        </div>
                      )}
                      {customer.preferredChannel && (
                        <div className="flex items-center space-x-3">
                          <MessageSquare className="w-4 h-4 text-primary-400" />
                          <div>
                            <p className="text-xs text-primary-600">Preferred Channel</p>
                            <p className="text-sm font-medium text-primary-900">{customer.preferredChannel}</p>
                          </div>
                        </div>
                      )}
                      {customer.timezone && (
                        <div className="flex items-center space-x-3">
                          <Clock className="w-4 h-4 text-primary-400" />
                          <div>
                            <p className="text-xs text-primary-600">Timezone</p>
                            <p className="text-sm font-medium text-primary-900">{customer.timezone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Addresses */}
                {(customer.billingAddress || customer.shippingAddress) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-primary-200">
                    {customer.billingAddress && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-primary-900 flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>Billing Address</span>
                        </h3>
                        <p className="text-sm text-primary-700">{formatAddress(customer.billingAddress)}</p>
                      </div>
                    )}
                    {customer.shippingAddress && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-primary-900 flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          <span>Shipping Address</span>
                        </h3>
                        <p className="text-sm text-primary-700">{formatAddress(customer.shippingAddress)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {customer.notes && (
                  <div className="pt-6 border-t border-primary-200">
                    <h3 className="text-sm font-semibold text-primary-900 mb-2">Notes</h3>
                    <p className="text-sm text-primary-700 whitespace-pre-wrap">{customer.notes}</p>
                  </div>
                )}

                {/* Engagement Stats */}
                <div className="pt-6 border-t border-primary-200">
                  <h3 className="text-lg font-semibold text-primary-900 mb-4">Engagement History</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {customer.firstContactDate && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-xs text-primary-600">First Contact</p>
                          <p className="text-sm font-medium text-primary-900">{formatDate(customer.firstContactDate)}</p>
                        </div>
                      </div>
                    )}
                    {customer.lastContactDate && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-emerald-500" />
                        <div>
                          <p className="text-xs text-primary-600">Last Contact</p>
                          <p className="text-sm font-medium text-primary-900">{formatDate(customer.lastContactDate)}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-xs text-primary-600">Customer Since</p>
                        <p className="text-sm font-medium text-primary-900">{formatDate(customer.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contacts Tab */}
            {activeTab === 'contacts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-primary-900">Contacts</h3>
                  <button className="btn-modern btn-primary btn-sm flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Contact</span>
                  </button>
                </div>
                {contacts.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No contacts found</p>
                    <button className="btn-modern btn-primary mt-4">Add First Contact</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contacts.map((contact) => (
                      <Link
                        key={contact.id}
                        to={`/crm/contacts/${contact.id}`}
                        className="modern-card p-4 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-primary-900">{contact.name}</h4>
                              {contact.jobTitle && (
                                <p className="text-xs text-primary-600 mt-1">{contact.jobTitle}</p>
                              )}
                              {contact.email && (
                                <div className="flex items-center space-x-1 mt-2">
                                  <Mail className="w-3 h-3 text-primary-400" />
                                  <span className="text-xs text-primary-700">{contact.email}</span>
                                </div>
                              )}
                              {contact.phone && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <Phone className="w-3 h-3 text-primary-400" />
                                  <span className="text-xs text-primary-700">{contact.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {contact.isPrimary && (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              Primary
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Deals Tab */}
            {activeTab === 'deals' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-primary-900">Deals</h3>
                  <button className="btn-modern btn-primary btn-sm flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Create Deal</span>
                  </button>
                </div>
                {deals.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No deals found</p>
                    <button className="btn-modern btn-primary mt-4">Create First Deal</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deals.map((deal) => (
                      <Link
                        key={deal.id}
                        to={`/crm/deals/${deal.id}`}
                        className="modern-card p-4 hover:shadow-lg transition-shadow block"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-semibold text-primary-900">{deal.name}</h4>
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                deal.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                                deal.status === 'WON' ? 'bg-emerald-100 text-emerald-700' :
                                deal.status === 'LOST' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {deal.status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 mt-2">
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-4 h-4 text-primary-400" />
                                <span className="text-sm font-medium text-primary-900">{formatCurrency(deal.amount)}</span>
                              </div>
                              {deal.expectedCloseDate && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4 text-primary-400" />
                                  <span className="text-xs text-primary-600">{formatDate(deal.expectedCloseDate)}</span>
                                </div>
                              )}
                              {deal.probability !== null && (
                                <div className="flex items-center space-x-1">
                                  <Target className="w-4 h-4 text-primary-400" />
                                  <span className="text-xs text-primary-600">{deal.probability}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-primary-900">Activities</h3>
                  <button className="btn-modern btn-primary btn-sm flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Log Activity</span>
                  </button>
                </div>
                {activities.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No activities found</p>
                    <button className="btn-modern btn-primary mt-4">Log First Activity</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="modern-card p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                activity.type === 'TASK' ? 'bg-blue-100 text-blue-700' :
                                activity.type === 'CALL' ? 'bg-emerald-100 text-emerald-700' :
                                activity.type === 'EMAIL' ? 'bg-purple-100 text-purple-700' :
                                activity.type === 'MEETING' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {activity.type}
                              </span>
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                activity.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                activity.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                activity.status === 'CANCELLED' ? 'bg-gray-100 text-gray-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {activity.status}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-primary-900 mt-2">{activity.subject}</h4>
                            {activity.description && (
                              <p className="text-xs text-primary-600 mt-1">{activity.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2">
                              {activity.dueDate && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3 text-primary-400" />
                                  <span className="text-xs text-primary-600">{formatDate(activity.dueDate)}</span>
                                </div>
                              )}
                              {activity.priority && (
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  activity.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                                  activity.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                  activity.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {activity.priority}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Communications Tab */}
            {activeTab === 'communications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-primary-900">Communications</h3>
                  <QuickLogCommunication 
                    customerId={id}
                    onSuccess={loadCustomerData}
                    buttonText="Log Communication"
                    buttonClass="btn-modern btn-primary btn-sm flex items-center space-x-2"
                  />
                </div>
                <CommunicationTimeline communications={communications} />
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary-900">Timeline</h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-primary-200"></div>
                  <div className="space-y-6">
                    {/* Combine activities and communications into timeline */}
                    {[...activities, ...communications]
                      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
                      .slice(0, 20)
                      .map((item, index) => (
                        <div key={`${item.id}-${index}`} className="relative pl-10">
                          <div className="absolute left-2 top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white"></div>
                          <div className="modern-card p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                item.type === 'TASK' || item.type === 'TODO' ? 'bg-blue-100 text-blue-700' :
                                item.type === 'CALL' || item.type === 'PHONE' ? 'bg-emerald-100 text-emerald-700' :
                                item.type === 'EMAIL' ? 'bg-purple-100 text-purple-700' :
                                item.type === 'MEETING' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {item.type}
                              </span>
                              <span className="text-xs text-primary-500">
                                {formatDate(item.createdAt || item.date)}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-primary-900">
                              {item.subject || item.description}
                            </h4>
                            {item.notes && (
                              <p className="text-xs text-primary-600 mt-1">{item.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                {[...activities, ...communications].length === 0 && (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No timeline events yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CustomerDetails;
