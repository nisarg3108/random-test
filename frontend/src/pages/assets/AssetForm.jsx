import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package, ArrowLeft } from 'lucide-react';
import { assetAPI } from '../../api/asset.api';
import Layout from '../../components/layout/Layout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AssetForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    assetCode: '',
    name: '',
    description: '',
    categoryId: '',
    purchaseDate: '',
    purchasePrice: '',
    vendor: '',
    invoiceNumber: '',
    serialNumber: '',
    model: '',
    manufacturer: '',
    location: '',
    condition: 'GOOD',
    depreciationMethod: '',
    depreciationRate: '',
    usefulLife: '',
    salvageValue: '0',
    totalExpectedUnits: '',
    warrantyExpiry: '',
    insuranceExpiry: '',
    insuranceProvider: '',
    insurancePolicyNo: '',
    notes: '',
  });

  useEffect(() => {
    loadCategories();
    if (isEditMode) {
      loadAsset();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const response = await assetAPI.getCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadAsset = async () => {
    setLoading(true);
    try {
      const response = await assetAPI.getAssetById(id);
      const asset = response.data;
      
      // Set the selected category for displaying defaults
      if (asset.categoryId) {
        const category = categories.find(cat => cat.id === asset.categoryId);
        setSelectedCategory(category);
      }
      
      setFormData({
        assetCode: asset.assetCode || '',
        name: asset.name || '',
        description: asset.description || '',
        categoryId: asset.categoryId || '',
        purchaseDate: asset.purchaseDate?.split('T')[0] || '',
        purchasePrice: asset.purchasePrice || '',
        vendor: asset.vendor || '',
        invoiceNumber: asset.invoiceNumber || '',
        serialNumber: asset.serialNumber || '',
        model: asset.model || '',
        manufacturer: asset.manufacturer || '',
        location: asset.location || '',
        condition: asset.condition || 'GOOD',
        depreciationMethod: asset.depreciationMethod || '',
        depreciationRate: asset.depreciationRate || '',
        usefulLife: asset.usefulLife || '',
        salvageValue: asset.salvageValue || '0',
        totalExpectedUnits: asset.totalExpectedUnits || '',
        warrantyExpiry: asset.warrantyExpiry?.split('T')[0] || '',
        insuranceExpiry: asset.insuranceExpiry?.split('T')[0] || '',
        insuranceProvider: asset.insuranceProvider || '',
        insurancePolicyNo: asset.insurancePolicyNo || '',
        notes: asset.notes || '',
      });
    } catch (err) {
      setError('Failed to load asset');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        ...formData,
        purchasePrice: parseFloat(formData.purchasePrice),
        depreciationRate: formData.depreciationRate ? parseFloat(formData.depreciationRate) : null,
        usefulLife: formData.usefulLife ? parseInt(formData.usefulLife) : null,
        salvageValue: parseFloat(formData.salvageValue || 0),
        totalExpectedUnits: formData.totalExpectedUnits ? parseInt(formData.totalExpectedUnits) : null,
      };

      if (isEditMode) {
        await assetAPI.updateAsset(id, data);
      } else {
        await assetAPI.createAsset(data);
      }

      navigate('/assets');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If category changed, apply defaults from category
    if (name === 'categoryId' && value) {
      const category = categories.find(cat => cat.id === value);
      setSelectedCategory(category);
      
      // Apply category defaults only if fields are empty
      setFormData(prev => ({
        ...prev,
        [name]: value,
        // Apply defaults only if current values are empty (not in edit mode or not manually changed)
        depreciationMethod: prev.depreciationMethod || category?.defaultDepreciationMethod || '',
        depreciationRate: prev.depreciationRate || (category?.defaultDepreciationRate?.toString() || ''),
        usefulLife: prev.usefulLife || (category?.defaultUsefulLife?.toString() || ''),
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (loading && isEditMode) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/assets')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Asset' : 'Add New Asset'}
            </h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          {/* Basic Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="assetCode"
                  value={formData.assetCode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Purchase Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Purchase Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor
                </label>
                <input
                  type="text"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Physical Details */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Physical Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manufacturer
                </label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Depreciation Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Depreciation Information</h2>
            {selectedCategory && (selectedCategory.defaultDepreciationMethod || selectedCategory.defaultDepreciationRate || selectedCategory.defaultUsefulLife) && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Category Defaults Applied:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  {selectedCategory.defaultDepreciationMethod && (
                    <li>• Method: {selectedCategory.defaultDepreciationMethod.replace(/_/g, ' ')}</li>
                  )}
                  {selectedCategory.defaultDepreciationRate && (
                    <li>• Rate: {selectedCategory.defaultDepreciationRate}% per year</li>
                  )}
                  {selectedCategory.defaultUsefulLife && (
                    <li>• Useful Life: {selectedCategory.defaultUsefulLife} months ({Math.round(selectedCategory.defaultUsefulLife / 12)} years)</li>
                  )}
                </ul>
                <p className="text-xs text-blue-600 mt-2">You can override these values below if needed.</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depreciation Method
                  {selectedCategory?.defaultDepreciationMethod && !formData.depreciationMethod && (
                    <span className="ml-2 text-xs text-blue-600">(Using category default)</span>
                  )}
                </label>
                <select
                  name="depreciationMethod"
                  value={formData.depreciationMethod}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  <option value="STRAIGHT_LINE">Straight Line</option>
                  <option value="DECLINING_BALANCE">Declining Balance</option>
                  <option value="UNITS_OF_PRODUCTION">Units of Production</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depreciation Rate (%)
                  {selectedCategory?.defaultDepreciationRate && !formData.depreciationRate && (
                    <span className="ml-2 text-xs text-blue-600">(Using category default)</span>
                  )}
                </label>
                <input
                  type="number"
                  name="depreciationRate"
                  value={formData.depreciationRate}
                  onChange={handleChange}
                  step="0.01"
                  placeholder={selectedCategory?.defaultDepreciationRate ? `Default: ${selectedCategory.defaultDepreciationRate}%` : ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Useful Life (Months)
                  {selectedCategory?.defaultUsefulLife && !formData.usefulLife && (
                    <span className="ml-2 text-xs text-blue-600">(Using category default)</span>
                  )}
                </label>
                <input
                  type="number"
                  name="usefulLife"
                  value={formData.usefulLife}
                  onChange={handleChange}
                  placeholder={selectedCategory?.defaultUsefulLife ? `Default: ${selectedCategory.defaultUsefulLife} months` : ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salvage Value
                </label>
                <input
                  type="number"
                  name="salvageValue"
                  value={formData.salvageValue}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Units of Production specific field */}
              {formData.depreciationMethod === 'UNITS_OF_PRODUCTION' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Expected Units <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="totalExpectedUnits"
                    value={formData.totalExpectedUnits}
                    onChange={handleChange}
                    required={formData.depreciationMethod === 'UNITS_OF_PRODUCTION'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 10000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Total units expected to be produced/used over asset lifetime
                  </p>
                </div>
              )}
            </div>

            {formData.depreciationMethod && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  {formData.depreciationMethod === 'STRAIGHT_LINE' && (
                    <>📊 Straight Line: Equal depreciation each period over useful life</>
                  )}
                  {formData.depreciationMethod === 'DECLINING_BALANCE' && (
                    <>📉 Declining Balance: Higher depreciation in early periods</>
                  )}
                  {formData.depreciationMethod === 'UNITS_OF_PRODUCTION' && (
                    <>🏭 Units of Production: Depreciation based on actual usage/output</>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Warranty & Insurance */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Warranty & Insurance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty Expiry
                </label>
                <input
                  type="date"
                  name="warrantyExpiry"
                  value={formData.warrantyExpiry}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Expiry
                </label>
                <input
                  type="date"
                  name="insuranceExpiry"
                  value={formData.insuranceExpiry}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Provider
                </label>
                <input
                  type="text"
                  name="insuranceProvider"
                  value={formData.insuranceProvider}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Policy Number
                </label>
                <input
                  type="text"
                  name="insurancePolicyNo"
                  value={formData.insurancePolicyNo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/assets')}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Asset' : 'Create Asset'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AssetForm;
