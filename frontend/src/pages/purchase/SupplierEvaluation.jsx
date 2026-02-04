import React, { useEffect, useState } from 'react';
import { Star, Plus, Search, Edit, Trash2 } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SupplierEvaluation = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    vendorId: '',
    evaluationPeriod: '',
    qualityRating: 0,
    deliveryRating: 0,
    priceRating: 0,
    serviceRating: 0,
    communicationRating: 0,
    onTimeDeliveryRate: '',
    defectRate: '',
    responseTime: '',
    strengths: '',
    weaknesses: '',
    recommendations: '',
    notes: ''
  });

  useEffect(() => {
    fetchEvaluations();
    fetchVendors();
  }, []);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/purchase/evaluations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvaluations(response.data);
    } catch (err) {
      setError('Failed to fetch evaluations');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/purchase/vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(response.data);
    } catch (err) {
      console.error('Failed to fetch vendors');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const payload = {
      ...formData,
      onTimeDeliveryRate: formData.onTimeDeliveryRate ? Number(formData.onTimeDeliveryRate) : null,
      defectRate: formData.defectRate ? Number(formData.defectRate) : null
    };

    try {
      if (editing) {
        await axios.put(`${API_URL}/api/purchase/evaluations/${editing.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/purchase/evaluations`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setShowModal(false);
      resetForm();
      fetchEvaluations();
      fetchVendors(); // Refresh to update vendor ratings
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save evaluation');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this evaluation?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/purchase/evaluations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvaluations();
      fetchVendors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete evaluation');
    }
  };

  const resetForm = () => {
    setFormData({
      vendorId: '',
      evaluationPeriod: '',
      qualityRating: 0,
      deliveryRating: 0,
      priceRating: 0,
      serviceRating: 0,
      communicationRating: 0,
      onTimeDeliveryRate: '',
      defectRate: '',
      responseTime: '',
      strengths: '',
      weaknesses: '',
      recommendations: '',
      notes: ''
    });
    setEditing(null);
  };

  const handleEdit = (evaluation) => {
    setEditing(evaluation);
    setFormData({
      vendorId: evaluation.vendorId || '',
      evaluationPeriod: evaluation.evaluationPeriod || '',
      qualityRating: evaluation.qualityRating || 0,
      deliveryRating: evaluation.deliveryRating || 0,
      priceRating: evaluation.priceRating || 0,
      serviceRating: evaluation.serviceRating || 0,
      communicationRating: evaluation.communicationRating || 0,
      onTimeDeliveryRate: evaluation.onTimeDeliveryRate?.toString() || '',
      defectRate: evaluation.defectRate?.toString() || '',
      responseTime: evaluation.responseTime || '',
      strengths: evaluation.strengths || '',
      weaknesses: evaluation.weaknesses || '',
      recommendations: evaluation.recommendations || '',
      notes: evaluation.notes || ''
    });
    setShowModal(true);
  };

  const filtered = evaluations.filter(e =>
    e.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.evaluationPeriod?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-amber-500 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Supplier Evaluation</h1>
            <p className="text-primary-600 mt-1">Track and evaluate vendor performance</p>
          </div>
          <button onClick={() => { setError(''); resetForm(); setShowModal(true); }} className="btn-modern btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Evaluation</span>
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        <div className="modern-card-elevated p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search evaluations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-modern pl-10" />
          </div>
        </div>

        <div className="modern-card-elevated">
          <div className="px-6 py-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold text-primary-900">Evaluations ({filtered.length})</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8"><LoadingSpinner /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No evaluations found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Quality</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Delivery</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Overall</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-primary-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-200">
                  {filtered.map((evaluation) => (
                    <tr key={evaluation.id} className="hover:bg-primary-50">
                      <td className="px-6 py-4 text-sm font-medium">{evaluation.vendor?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm">{evaluation.evaluationPeriod || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          {renderStars(evaluation.qualityRating || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          {renderStars(evaluation.deliveryRating || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          {renderStars(evaluation.priceRating || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          {renderStars(Math.round(evaluation.overallRating || 0))}
                          <span className="ml-2 text-sm font-medium">{evaluation.overallRating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleEdit(evaluation)} className="text-blue-600 hover:text-blue-800">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(evaluation.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold">{editing ? 'Edit' : 'New'} Evaluation</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(90vh-80px)] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Vendor <span className="text-red-500">*</span></label>
                  <select value={formData.vendorId} onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })} required className="input-modern">
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.vendorCode})</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Evaluation Period</label>
                  <input type="text" placeholder="e.g., Q1-2024, Jan-2024" value={formData.evaluationPeriod} onChange={(e) => setFormData({ ...formData, evaluationPeriod: e.target.value })} className="input-modern" />
                </div>

                {['quality', 'delivery', 'price', 'service', 'communication'].map(field => (
                  <div key={field}>
                    <label className="block text-sm font-medium mb-1 capitalize">{field} Rating (1-5)</label>
                    <input type="number" min="0" max="5" step="0.1" value={formData[`${field}Rating`]} onChange={(e) => setFormData({ ...formData, [`${field}Rating`]: Number(e.target.value) })} className="input-modern" />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium mb-1">On-Time Delivery Rate (%)</label>
                  <input type="number" min="0" max="100" step="0.1" value={formData.onTimeDeliveryRate} onChange={(e) => setFormData({ ...formData, onTimeDeliveryRate: e.target.value })} className="input-modern" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Defect Rate (%)</label>
                  <input type="number" min="0" max="100" step="0.1" value={formData.defectRate} onChange={(e) => setFormData({ ...formData, defectRate: e.target.value })} className="input-modern" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Response Time</label>
                  <input type="text" placeholder="e.g., 24 hours, 2 days" value={formData.responseTime} onChange={(e) => setFormData({ ...formData, responseTime: e.target.value })} className="input-modern" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Strengths</label>
                  <textarea value={formData.strengths} onChange={(e) => setFormData({ ...formData, strengths: e.target.value })} rows="2" className="input-modern"></textarea>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Weaknesses</label>
                  <textarea value={formData.weaknesses} onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })} rows="2" className="input-modern"></textarea>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Recommendations</label>
                  <textarea value={formData.recommendations} onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })} rows="2" className="input-modern"></textarea>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="2" className="input-modern"></textarea>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-modern btn-secondary">Cancel</button>
                <button type="submit" className="btn-modern btn-primary">{editing ? 'Update' : 'Create'} Evaluation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SupplierEvaluation;
