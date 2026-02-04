import React, { useEffect, useMemo, useState } from 'react';
import { Plus, DollarSign, Briefcase, Edit, Trash2 } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { crmAPI } from '../../api/crm.api';

const STAGES = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

const SalesPipeline = () => {
  const [deals, setDeals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    name: '',
    stage: 'PROSPECTING',
    value: 0,
    expectedCloseDate: '',
    status: 'OPEN',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [dealsRes, customersRes] = await Promise.all([
        crmAPI.getDeals(),
        crmAPI.getCustomers()
      ]);
      setDeals(dealsRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (err) {
      setError('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({ customerId: '', name: '', stage: 'PROSPECTING', value: 0, expectedCloseDate: '', status: 'OPEN', notes: '' });
    setEditingDeal(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...formData,
        value: Number(formData.value || 0)
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
      setError('Failed to save deal');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (deal) => {
    setEditingDeal(deal);
    setFormData({
      customerId: deal.customerId,
      name: deal.name || '',
      stage: deal.stage || 'PROSPECTING',
      value: deal.value || 0,
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

  const dealsByStage = useMemo(() => STAGES.reduce((acc, stage) => {
    acc[stage] = deals.filter(deal => deal.stage === stage);
    return acc;
  }, {}), [deals]);

  const pipelineStats = useMemo(() => {
    const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const wonValue = deals.filter(deal => deal.stage === 'WON').reduce((sum, deal) => sum + (deal.value || 0), 0);
    return { totalValue, wonValue, totalDeals: deals.length };
  }, [deals]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Sales Pipeline</h1>
            <p className="text-primary-600 mt-1">Track deals across pipeline stages</p>
          </div>
          <button className="btn-modern btn-primary flex items-center space-x-2" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            <span>Add Deal</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Deals', value: pipelineStats.totalDeals, icon: Briefcase, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Pipeline Value', value: `₹${pipelineStats.totalValue.toFixed(2)}`, icon: DollarSign, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Won Value', value: `₹${pipelineStats.wonValue.toFixed(2)}`, icon: DollarSign, bg: 'bg-purple-50', color: 'text-purple-600' }
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

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {STAGES.map(stage => (
            <div key={stage} className="modern-card-elevated p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-primary-700">{stage}</h3>
                <span className="text-xs text-primary-500">{dealsByStage[stage]?.length || 0}</span>
              </div>
              {loading ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-3">
                  {(dealsByStage[stage] || []).map(deal => (
                    <div key={deal.id} className="p-3 border border-primary-100 rounded-lg bg-primary-50">
                      <div className="text-sm font-semibold text-primary-900">{deal.name}</div>
                      <div className="text-xs text-primary-600">{deal.customer?.name || 'No customer'}</div>
                      <div className="text-sm font-medium text-emerald-600 mt-2">₹{(deal.value || 0).toFixed(2)}</div>
                      <div className="flex items-center justify-end space-x-2 mt-3">
                        <button onClick={() => handleEdit(deal)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(deal.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="px-6 py-4 border-b border-primary-200">
                <h3 className="text-lg font-semibold text-primary-900">
                  {editingDeal ? 'Edit Deal' : 'Add Deal'}
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700">Customer</label>
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
                  <label className="block text-sm font-medium text-primary-700">Deal Name</label>
                  <input
                    className="input-modern mt-1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Stage</label>
                    <select
                      className="input-modern mt-1"
                      value={formData.stage}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    >
                      {STAGES.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700">Deal Value</label>
                    <input
                      className="input-modern mt-1"
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700">Expected Close</label>
                  <input
                    className="input-modern mt-1"
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                  />
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
                    {loading ? 'Saving...' : 'Save Deal'}
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
