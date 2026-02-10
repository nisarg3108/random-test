import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Edit, DollarSign, Calendar, User, TrendingUp, 
  Target, Briefcase, MessageSquare, CheckCircle, Clock, Plus,
  Trash2, AlertCircle, Users, Percent, ShoppingCart, Package
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CommunicationTimeline from '../../components/crm/CommunicationTimeline';
import QuickLogCommunication from '../../components/crm/QuickLogCommunication';
import { crmAPI } from '../../api/crm.api';

const DealDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [activities, setActivities] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductIndex, setEditingProductIndex] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    quantity: 1,
    price: 0,
    total: 0
  });

  useEffect(() => {
    loadDealData();
  }, [id]);

  const loadDealData = async () => {
    setLoading(true);
    setError('');
    try {
      const dealRes = await crmAPI.getDeal(id);
      const dealData = dealRes.data;
      setDeal(dealData);

      const [customerRes, activitiesRes, communicationsRes] = await Promise.all([
        dealData.customerId ? crmAPI.getCustomer(dealData.customerId).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        crmAPI.getActivities({ dealId: id }).catch(() => ({ data: [] })),
        crmAPI.getCommunications({ dealId: id }).catch(() => ({ data: [] }))
      ]);

      setCustomer(customerRes.data);
      setActivities(activitiesRes.data || []);
      setCommunications(communicationsRes.data || []);
    } catch (err) {
      setError('Failed to load deal details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    return `₹${Number(amount).toLocaleString()}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const config = {
      OPEN: 'bg-blue-100 text-blue-700',
      WON: 'bg-emerald-100 text-emerald-700',
      LOST: 'bg-red-100 text-red-700'
    };
    return config[status] || config.OPEN;
  };

  const handleAddProduct = () => {
    setEditingProductIndex(null);
    setProductForm({
      name: '',
      description: '',
      quantity: 1,
      price: 0,
      total: 0
    });
    setShowProductModal(true);
  };

  const handleEditProduct = (index) => {
    const product = deal.products[index];
    setEditingProductIndex(index);
    setProductForm(product);
    setShowProductModal(true);
  };

  const handleProductSubmit = async () => {
    try {
      const updatedProducts = [...(deal.products || [])];
      
      if (editingProductIndex !== null) {
        updatedProducts[editingProductIndex] = productForm;
      } else {
        updatedProducts.push(productForm);
      }

      // Recalculate deal totals
      const productsTotal = updatedProducts.reduce((sum, p) => sum + Number(p.total || 0), 0);
      const discount = Number(deal.discount || 0);
      const tax = Number(deal.tax || 0);
      const subtotal = productsTotal - discount;
      const total = subtotal + tax;

      await crmAPI.updateDeal(id, {
        products: updatedProducts,
        amount: productsTotal,
        total: total
      });

      setShowProductModal(false);
      loadDealData();
    } catch (err) {
      setError('Failed to save product');
    }
  };

  const handleDeleteProduct = async (index) => {
    if (!window.confirm('Delete this product?')) return;
    
    try {
      const updatedProducts = deal.products.filter((_, i) => i !== index);
      const productsTotal = updatedProducts.reduce((sum, p) => sum + Number(p.total || 0), 0);
      const discount = Number(deal.discount || 0);
      const tax = Number(deal.tax || 0);
      const subtotal = productsTotal - discount;
      const total = subtotal + tax;

      await crmAPI.updateDeal(id, {
        products: updatedProducts,
        amount: productsTotal,
        total: total
      });

      loadDealData();
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  const handleProductFieldChange = (field, value) => {
    const updated = { ...productForm, [field]: value };
    if (field === 'quantity' || field === 'price') {
      updated.total = Number(updated.quantity || 0) * Number(updated.price || 0);
    }
    setProductForm(updated);
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

  if (error || !deal) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Deal</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => navigate('/crm/sales-pipeline')} className="btn-modern btn-primary">
            Back to Pipeline
          </button>
        </div>
      </Layout>
    );
  }

  const financials = {
    amount: Number(deal.amount || 0),
    discount: Number(deal.discount || 0),
    subtotal: Number(deal.amount || 0) - Number(deal.discount || 0),
    tax: Number(deal.tax || 0),
    total: Number(deal.total || 0)
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Briefcase },
    { id: 'products', label: `Products (${(deal.products || []).length})`, icon: Package },
    { id: 'activities', label: `Activities (${activities.length})`, icon: CheckCircle },
    { id: 'timeline', label: 'Timeline', icon: Clock }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/crm/sales-pipeline')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-primary-900">{deal.name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(deal.status)}`}>
                  {deal.status}
                </span>
                {deal.stage && (
                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {deal.stage}
                  </span>
                )}
                {deal.probability > 0 && (
                  <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    <Target className="w-3 h-3" />
                    <span>{deal.probability}%</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => navigate(`/crm/sales-pipeline`)} className="btn-modern btn-primary flex items-center space-x-2">
            <Edit className="w-4 h-4" />
            <span>Edit Deal</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Deal Value</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{formatCurrency(financials.amount)}</p>
                {deal.probability > 0 && (
                  <p className="text-xs text-primary-500 mt-1">Weighted: {formatCurrency(financials.amount * deal.probability / 100)}</p>
                )}
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Total Amount</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{formatCurrency(financials.total)}</p>
                <p className="text-xs text-primary-500 mt-1">After discount & tax</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Expected Close</p>
                <p className="text-lg font-bold text-primary-900 mt-1">{formatDate(deal.expectedCloseDate)}</p>
                {deal.expectedCloseDate && (
                  <p className="text-xs text-primary-500 mt-1">
                    {Math.ceil((new Date(deal.expectedCloseDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                  </p>
                )}
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="modern-card-elevated p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-600">Activities</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{activities.length}</p>
                <p className="text-xs text-primary-500 mt-1">{activities.filter(a => a.status !== 'COMPLETED').length} open</p>
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
                  {/* Deal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary-900 flex items-center space-x-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      <span>Deal Information</span>
                    </h3>
                    <div className="space-y-3">
                      {customer && (
                        <div className="flex justify-between">
                          <span className="text-sm text-primary-600">Customer</span>
                          <Link to={`/crm/customers/${customer.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                            {customer.name}
                          </Link>
                        </div>
                      )}
                      {deal.stage && (
                        <div className="flex justify-between">
                          <span className="text-sm text-primary-600">Stage</span>
                          <span className="text-sm font-medium text-primary-900">{deal.stage}</span>
                        </div>
                      )}
                      {deal.probability !== null && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-primary-600">Win Probability</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${deal.probability}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-primary-900">{deal.probability}%</span>
                          </div>
                        </div>
                      )}
                      {deal.source && (
                        <div className="flex justify-between">
                          <span className="text-sm text-primary-600">Source</span>
                          <span className="text-sm font-medium text-primary-900">{deal.source}</span>
                        </div>
                      )}
                      {deal.owner && (
                        <div className="flex justify-between">
                          <span className="text-sm text-primary-600">Owner</span>
                          <span className="text-sm font-medium text-primary-900">{deal.owner.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary-900 flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                      <span>Financial Summary</span>
                    </h3>
                    <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-primary-600">Amount:</span>
                        <span className="font-medium text-primary-900">{formatCurrency(financials.amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-primary-600">Discount:</span>
                        <span className="font-medium text-red-600">-{formatCurrency(financials.discount)}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-gray-300 pt-2">
                        <span className="text-primary-600">Subtotal:</span>
                        <span className="font-medium text-primary-900">{formatCurrency(financials.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-primary-600">Tax:</span>
                        <span className="font-medium text-primary-900">+{formatCurrency(financials.tax)}</span>
                      </div>
                      <div className="flex justify-between text-base border-t-2 border-gray-400 pt-2">
                        <span className="font-semibold text-primary-900">Total:</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(financials.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="pt-6 border-t border-primary-200">
                  <h3 className="text-lg font-semibold text-primary-900 mb-4">Timeline</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-xs text-primary-600">Created</p>
                        <p className="text-sm font-medium text-primary-900">{formatDate(deal.createdAt)}</p>
                      </div>
                    </div>
                    {deal.expectedCloseDate && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="text-xs text-primary-600">Expected Close</p>
                          <p className="text-sm font-medium text-primary-900">{formatDate(deal.expectedCloseDate)}</p>
                        </div>
                      </div>
                    )}
                    {deal.closedDate && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-emerald-500" />
                        <div>
                          <p className="text-xs text-primary-600">Closed</p>
                          <p className="text-sm font-medium text-primary-900">{formatDate(deal.closedDate)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {deal.notes && (
                  <div className="pt-6 border-t border-primary-200">
                    <h3 className="text-sm font-semibold text-primary-900 mb-2">Notes</h3>
                    <p className="text-sm text-primary-700 whitespace-pre-wrap">{deal.notes}</p>
                  </div>
                )}

                {/* Closure Details */}
                {(deal.wonReason || deal.lostReason) && (
                  <div className="pt-6 border-t border-primary-200">
                    <h3 className="text-sm font-semibold text-primary-900 mb-2">Closure Details</h3>
                    {deal.wonReason && (
                      <div className="text-sm">
                        <span className="text-primary-600">Won Reason: </span>
                        <span className="font-medium text-emerald-700">{deal.wonReason}</span>
                      </div>
                    )}
                    {deal.lostReason && (
                      <div className="text-sm">
                        <span className="text-primary-600">Lost Reason: </span>
                        <span className="font-medium text-red-700">{deal.lostReason}</span>
                      </div>
                    )}
                    {deal.lostToCompetitor && (
                      <div className="text-sm mt-1">
                        <span className="text-primary-600">Lost to: </span>
                        <span className="font-medium text-primary-900">{deal.lostToCompetitor}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-primary-900">Product Line Items</h3>
                  <button onClick={handleAddProduct} className="btn-modern btn-primary btn-sm flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                </div>
                
                {(deal.products || []).length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No products added</p>
                    <button onClick={handleAddProduct} className="btn-modern btn-primary mt-4">Add First Product</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-primary-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-primary-500 uppercase">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-primary-500 uppercase">Description</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-primary-500 uppercase">Quantity</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-primary-500 uppercase">Price</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-primary-500 uppercase">Total</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-primary-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary-200">
                        {deal.products.map((product, index) => (
                          <tr key={index} className="hover:bg-primary-50">
                            <td className="px-4 py-3 text-sm font-medium text-primary-900">{product.name}</td>
                            <td className="px-4 py-3 text-sm text-primary-700">{product.description || '—'}</td>
                            <td className="px-4 py-3 text-sm text-right text-primary-900">{product.quantity}</td>
                            <td className="px-4 py-3 text-sm text-right text-primary-900">{formatCurrency(product.price)}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-emerald-600">{formatCurrency(product.total)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button onClick={() => handleEditProduct(index)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteProduct(index)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-primary-50 font-semibold">
                        <tr>
                          <td colSpan="4" className="px-4 py-3 text-sm text-right text-primary-900">Products Total:</td>
                          <td className="px-4 py-3 text-sm text-right text-emerald-600">{formatCurrency(financials.amount)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
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

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-primary-900">Timeline</h3>
                  <QuickLogCommunication 
                    dealId={id}
                    customerId={deal.customerId}
                    onSuccess={loadDealData}
                    buttonText="Log Communication"
                    buttonClass="btn-modern btn-primary btn-sm flex items-center space-x-2"
                  />
                </div>
                
                {/* Activities Section */}
                {activities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-primary-700 mb-3">Activities</h4>
                    <div className="space-y-3">
                      {activities.slice(0, 5).map((activity) => (
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
                
                {/* Communications Section */}
                <div>
                  <h4 className="text-sm font-semibold text-primary-700 mb-3">Communications</h4>
                  <CommunicationTimeline communications={communications} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-primary-900">
                  {editingProductIndex !== null ? 'Edit Product' : 'Add Product'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => handleProductFieldChange('name', e.target.value)}
                    className="input-modern"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => handleProductFieldChange('description', e.target.value)}
                    className="input-modern"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={productForm.quantity}
                      onChange={(e) => handleProductFieldChange('quantity', e.target.value)}
                      className="input-modern"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => handleProductFieldChange('price', e.target.value)}
                      className="input-modern"
                      required
                    />
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-primary-900">Total:</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(productForm.total)}</span>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="btn-modern btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProductSubmit}
                    disabled={!productForm.name || !productForm.quantity || !productForm.price}
                    className="btn-modern btn-primary"
                  >
                    {editingProductIndex !== null ? 'Update' : 'Add'} Product
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

export default DealDetails;
