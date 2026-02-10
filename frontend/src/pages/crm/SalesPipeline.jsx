import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, DollarSign, Briefcase, Edit, Trash2, Settings, TrendingUp, Package, X } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { crmAPI } from '../../api/crm.api';

const SalesPipeline = () => {
  const [deals, setDeals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    name: '',
    pipelineId: '',
    stage: 'PROSPECTING',
    amount: 0,
    discount: 0,
    tax: 0,
    total: 0,
    products: [],
    probability: 0,
    expectedCloseDate: '',
    status: 'OPEN',
    notes: ''
  });

  // Calculate totals whenever amount, discount, or tax changes
  const calculateTotal = (amount, discount, tax) => {
    const amt = Number(amount) || 0;
    const disc = Number(discount) || 0;
    const taxVal = Number(tax) || 0;
    const subtotal = amt - disc;
    const total = subtotal + taxVal;
    return { subtotal, total };
  };

  const handleFinancialChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    const { total } = calculateTotal(newData.amount, newData.discount, newData.tax);
    setFormData({ ...newData, total });
  };

  const handleAddProduct = () => {
    const newProduct = {
      name: '',
      description: '',
      quantity: 1,
      price: 0,
      total: 0
    };
    setFormData(prev => ({
      ...prev,
      products: [...(prev.products || []), newProduct]
    }));
  };

  const handleRemoveProduct = (index) => {
    const updatedProducts = formData.products.filter((_, i) => i !== index);
    const productsTotal = updatedProducts.reduce((sum, p) => sum + Number(p.total || 0), 0);
    const { total } = calculateTotal(productsTotal, formData.discount, formData.tax);
    setFormData(prev => ({
      ...prev,
      products: updatedProducts,
      amount: productsTotal,
      total
    }));
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    
    // Recalculate product total if quantity or price changed
    if (field === 'quantity' || field === 'price') {
      updatedProducts[index].total = Number(updatedProducts[index].quantity || 0) * Number(updatedProducts[index].price || 0);
    }
    
    // Recalculate deal amount from all products
    const productsTotal = updatedProducts.reduce((sum, p) => sum + Number(p.total || 0), 0);
    const { total } = calculateTotal(productsTotal, formData.discount, formData.tax);
    
    setFormData(prev => ({
      ...prev,
      products: updatedProducts,
      amount: productsTotal,
      total
    }));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dealsRes, customersRes, pipelinesRes] = await Promise.all([
        crmAPI.getDeals(),
        crmAPI.getCustomers(),
        crmAPI.getPipelines({ active: true })
      ]);
      
      setDeals(dealsRes.data || []);
      setCustomers(customersRes.data || []);
      setPipelines(pipelinesRes.data || []);
      
      // Select default pipeline
      if (!selectedPipeline && pipelinesRes.data?.length > 0) {
        const defaultPipeline = pipelinesRes.data.find(p => p.isDefault) || pipelinesRes.data[0];
        setSelectedPipeline(defaultPipeline);
        setFormData(prev => ({ ...prev, pipelineId: defaultPipeline.id }));
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      customerId: '',
      name: '',
      pipelineId: selectedPipeline?.id || '',
      stage: 'PROSPECTING',
      amount: 0,
      discount: 0,
      tax: 0,
      total: 0,
      products: [],
      probability: 0,
      expectedCloseDate: '',
      status: 'OPEN',
      notes: ''
    });
    setEditingDeal(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount || 0),
        discount: Number(formData.discount || 0),
        tax: Number(formData.tax || 0),
        total: Number(formData.total || 0),
        probability: Number(formData.probability || 0)
      };
      
      if (editingDeal) {
        await crmAPI.updateDeal(editingDeal.id, payload);
      } else {
        await crmAPI.createDeal(payload);
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save deal');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (deal) => {
    setEditingDeal(deal);
    setFormData({
      customerId: deal.customerId,
      name: deal.name || '',
      pipelineId: deal.pipelineId || selectedPipeline?.id || '',
      stage: deal.stage || 'PROSPECTING',
      amount: deal.amount || 0,      discount: deal.discount || 0,
      tax: deal.tax || 0,
      total: deal.total || 0,
      products: deal.products || [],      probability: deal.probability || 0,
      expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.split('T')[0] : '',
      status: deal.status || 'OPEN',
      notes: deal.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this deal?')) return;
    try {
      await crmAPI.deleteDeal(id);
      loadData();
    } catch (err) {
      setError('Failed to delete deal');
    }
  };

  // Filter deals by selected pipeline
  const pipelineDeals = useMemo(() => 
    deals.filter(deal => deal.pipelineId === selectedPipeline?.id || (!deal.pipelineId && selectedPipeline?.isDefault)),
    [deals, selectedPipeline]
  );

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    if (!selectedPipeline?.stages) return {};
    
    return selectedPipeline.stages.reduce((acc, stage) => {
      acc[stage.name] = pipelineDeals.filter(deal => deal.stage === stage.name);
      return acc;
    }, {});
  }, [pipelineDeals, selectedPipeline]);

  const pipelineStats = useMemo(() => {
    const totalValue = pipelineDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
    const wonValue = pipelineDeals.filter(deal => deal.status === 'WON').reduce((sum, deal) => sum + (deal.amount || 0), 0);
    const avgDealSize = pipelineDeals.length > 0 ? totalValue / pipelineDeals.length : 0;
    return { totalValue, wonValue, totalDeals: pipelineDeals.length, avgDealSize };
  }, [pipelineDeals]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Sales Pipeline</h1>
            <p className="text-primary-600 mt-1">Track deals across pipeline stages</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/crm/pipelines/settings" className="btn-modern btn-secondary flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Configure Pipelines</span>
            </Link>
            <button className="btn-modern btn-primary flex items-center space-x-2" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4" />
              <span>Add Deal</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* Pipeline Selector */}
        {pipelines.length > 1 && (
          <div className="modern-card-elevated p-4">
            <label className="block text-sm font-medium text-primary-700 mb-2">Select Pipeline</label>
            <select
              className="input-modern"
              value={selectedPipeline?.id || ''}
              onChange={(e) => {
                const pipeline = pipelines.find(p => p.id === e.target.value);
                setSelectedPipeline(pipeline);
                setFormData(prev => ({ ...prev, pipelineId: e.target.value }));
              }}
            >
              {pipelines.map(pipeline => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name} {pipeline.isDefault && '(Default)'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Deals', value: pipelineStats.totalDeals, icon: Briefcase, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Pipeline Value', value: `₹${pipelineStats.totalValue.toLocaleString()}`, icon: DollarSign, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Won Value', value: `₹${pipelineStats.wonValue.toLocaleString()}`, icon: TrendingUp, bg: 'bg-purple-50', color: 'text-purple-600' },
            { label: 'Avg Deal Size', value: `₹${pipelineStats.avgDealSize.toLocaleString()}`, icon: DollarSign, bg: 'bg-orange-50', color: 'text-orange-600' }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="modern-card-elevated p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-600">{stat.label}</p>
                    <p className="text-xl font-bold text-primary-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Kanban Board */}
        {selectedPipeline && (
          <div className="overflow-x-auto">
            <div className="inline-flex space-x-4 pb-4">
              {(selectedPipeline.stages || []).sort((a, b) => a.order - b.order).map(stage => (
                <div key={stage.id} className="w-80 flex-shrink-0">
                  <div className="modern-card-elevated">
                    <div className="p-4 border-b border-primary-200 bg-gradient-to-r from-primary-50 to-white">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-primary-900">{stage.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
                            {dealsByStage[stage.name]?.length || 0}
                          </span>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                            {stage.probability}%
                          </span>
                        </div>
                      </div>
                      {stage.description && (
                        <p className="text-xs text-primary-500">{stage.description}</p>
                      )}
                    </div>
                    <div className="p-4 space-y-3 min-h-[200px] max-h-[600px] overflow-y-auto">
                      {loading ? (
                        <LoadingSpinner />
                      ) : (
                        (dealsByStage[stage.name] || []).map(deal => (
                          <div key={deal.id} className="p-3 border-2 border-primary-100 rounded-lg bg-white hover:shadow-md transition-shadow cursor-move">
                            <div className="flex items-start justify-between mb-2">
                              <Link to={`/crm/deals/${deal.id}`} className="text-sm font-bold text-primary-900 hover:underline flex-1">
                                {deal.name}
                              </Link>
                              <div className="flex items-center space-x-1 ml-2">
                                <button onClick={() => handleEdit(deal)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(deal.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="text-xs text-primary-600 mb-2">
                              {deal.customer?.name || 'No customer'}
                            </div>
                            
                            {/* Financial Display */}
                            <div className="space-y-1 mb-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-base font-bold text-emerald-600">
                                    ₹{((deal.total !== undefined && deal.total !== null) ? deal.total : deal.amount || 0).toLocaleString()}
                                  </div>
                                  {(deal.discount > 0 || deal.tax > 0) && (
                                    <div className="text-xs text-gray-500">
                                      {deal.discount > 0 && <span className="text-red-600">-₹{Number(deal.discount).toLocaleString()} </span>}
                                      {deal.tax > 0 && <span className="text-blue-600">+₹{Number(deal.tax).toLocaleString()} tax</span>}
                                    </div>
                                  )}
                                </div>
                                {deal.probability > 0 && (
                                  <div className="text-xs text-primary-500">
                                    {deal.probability}% likely
                                  </div>
                                )}
                              </div>
                              {(deal.products && deal.products.length > 0) && (
                                <div className="text-xs text-blue-600">
                                  {deal.products.length} product{deal.products.length > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                            
                            {deal.expectedCloseDate && (
                              <div className="text-xs text-primary-500 mt-2">
                                Close: {new Date(deal.expectedCloseDate).toLocaleDateString()}
                              </div>
                            )}
                            {deal.owner && (
                              <div className="text-xs text-primary-500 mt-1">
                                Owner: {deal.owner.email}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!selectedPipeline && !loading && (
          <div className="text-center py-12 text-primary-500">
            No pipelines configured. Please configure a pipeline first.
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-primary-200">
                <h3 className="text-lg font-semibold text-primary-900">
                  {editingDeal ? 'Edit Deal' : 'Add Deal'}
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700">Customer *</label>
                  <select
                    className="input-modern mt-1"
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    required
                  >
                    <option value="">Select customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary-700">Deal Name *</label>
                  <input
                    className="input-modern mt-1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Pipeline</label>
                    <select
                      className="input-modern mt-1"
                      value={formData.pipelineId}
                      onChange={(e) => setFormData({ ...formData, pipelineId: e.target.value })}
                    >
                      {pipelines.map(pipeline => (
                        <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Stage</label>
                    <select
                      className="input-modern mt-1"
                      value={formData.stage}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    >
                      {(selectedPipeline?.stages || []).map(stage => (
                        <option key={stage.id} value={stage.name}>{stage.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700">
                      Deal Amount (₹)
                      {(formData.products || []).length > 0 && (
                        <span className="text-xs text-blue-600 ml-2">(Auto-calculated from products)</span>
                      )}
                    </label>
                    <input
                      className="input-modern mt-1"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => handleFinancialChange('amount', e.target.value)}
                      disabled={(formData.products || []).length > 0}
                      title={(formData.products || []).length > 0 ? "Amount is calculated from product line items" : ""}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Probability (%)</label>
                    <input
                      className="input-modern mt-1"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.probability}
                      onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                    />
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-primary-900 mb-3">Financial Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-700">Discount (₹)</label>
                      <input
                        className="input-modern mt-1"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discount}
                        onChange={(e) => handleFinancialChange('discount', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700">Tax (₹)</label>
                      <input
                        className="input-modern mt-1"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.tax}
                        onChange={(e) => handleFinancialChange('tax', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Calculation Summary */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-600">Amount:</span>
                      <span className="font-medium text-primary-900">₹{Number(formData.amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-600">Discount:</span>
                      <span className="font-medium text-red-600">-₹{Number(formData.discount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-300 pt-2">
                      <span className="text-primary-600">Subtotal:</span>
                      <span className="font-medium text-primary-900">₹{(Number(formData.amount || 0) - Number(formData.discount || 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-600">Tax:</span>
                      <span className="font-medium text-primary-900">+₹{Number(formData.tax || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-base border-t-2 border-gray-400 pt-2">
                      <span className="font-semibold text-primary-900">Total:</span>
                      <span className="font-bold text-emerald-600">₹{Number(formData.total || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Product Line Items */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-primary-900 flex items-center space-x-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span>Product Line Items</span>
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="btn-modern btn-secondary btn-sm flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Product</span>
                    </button>
                  </div>
                  
                  {(formData.products || []).length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No products added</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {formData.products.map((product, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="text-xs font-semibold text-primary-700">Product {index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-primary-600 mb-1">Product Name</label>
                              <input
                                type="text"
                                className="input-modern text-sm"
                                value={product.name}
                                onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                                placeholder="Enter product name"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-primary-600 mb-1">Description</label>
                              <input
                                type="text"
                                className="input-modern text-sm"
                                value={product.description || ''}
                                onChange={(e) => handleProductChange(index, 'description', e.target.value)}
                                placeholder="Optional description"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-primary-600 mb-1">Quantity</label>
                              <input
                                type="number"
                                min="1"
                                className="input-modern text-sm"
                                value={product.quantity}
                                onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-primary-600 mb-1">Price (₹)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="input-modern text-sm"
                                value={product.price}
                                onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-primary-600">Line Total:</span>
                            <span className="text-sm font-bold text-emerald-600">₹{Number(product.total || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Expected Close Date</label>
                    <input
                      className="input-modern mt-1"
                      type="date"
                      value={formData.expectedCloseDate}
                      onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Status</label>
                    <select
                      className="input-modern mt-1"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="OPEN">Open</option>
                      <option value="WON">Won</option>
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

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    className="btn-modern btn-secondary"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-modern btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : editingDeal ? 'Update Deal' : 'Create Deal'}
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

export default SalesPipeline;
