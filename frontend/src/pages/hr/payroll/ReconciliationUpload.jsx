import { useState } from 'react';
import payrollAPI from '../../../api/payrollAPI';
import { Upload, X, AlertCircle, CheckCircle, FileText, Plus, Trash2 } from 'lucide-react';

export default function ReconciliationUpload({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [reconciliationResult, setReconciliationResult] = useState(null);
  const [manualEntries, setManualEntries] = useState([
    { employeeCode: '', accountNumber: '', amount: '', transactionRef: '' }
  ]);

  const addEntry = () => {
    setManualEntries([
      ...manualEntries,
      { employeeCode: '', accountNumber: '', amount: '', transactionRef: '' }
    ]);
  };

  const removeEntry = (index) => {
    setManualEntries(manualEntries.filter((_, i) => i !== index));
  };

  const updateEntry = (index, field, value) => {
    const updated = [...manualEntries];
    updated[index][field] = value;
    setManualEntries(updated);
  };

  const handleReconcile = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Filter out empty entries and format data
      const reconciliationData = manualEntries
        .filter(entry => entry.employeeCode && entry.amount)
        .map(entry => ({
          employeeCode: entry.employeeCode.trim(),
          accountNumber: entry.accountNumber.trim() || undefined,
          amount: parseFloat(entry.amount),
          transactionRef: entry.transactionRef.trim() || undefined
        }));

      if (reconciliationData.length === 0) {
        setError('Please add at least one valid entry');
        setLoading(false);
        return;
      }

      const response = await payrollAPI.reconcilePayments({ reconciliationData });
      setReconciliationResult(response.data);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reconcile payments');
      console.error('Reconciliation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-900">Bank Payment Reconciliation</h2>
              <p className="text-sm text-primary-600">Match bank statement entries with disbursements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-primary-400 hover:text-primary-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!success ? (
            <>
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">How to Reconcile</p>
                    <ul className="text-xs text-blue-800 mt-2 space-y-1 ml-4 list-disc">
                      <li>Enter employee code and payment amount from your bank statement</li>
                      <li>Optionally add account number and transaction reference for better matching</li>
                      <li>System will automatically match with pending/processing disbursements</li>
                      <li>Matched disbursements will be marked as COMPLETED</li>
                      <li>Related payslips will be automatically marked as PAID</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Manual Entry Form */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-primary-700">
                    Bank Statement Entries
                  </label>
                  <button
                    onClick={addEntry}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Entry
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {manualEntries.map((entry, index) => (
                    <div key={index} className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-primary-700 mb-1">
                              Employee Code *
                            </label>
                            <input
                              type="text"
                              placeholder="EMP001"
                              value={entry.employeeCode}
                              onChange={(e) => updateEntry(index, 'employeeCode', e.target.value)}
                              className="input-modern text-sm"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-primary-700 mb-1">
                              Amount *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="50000.00"
                              value={entry.amount}
                              onChange={(e) => updateEntry(index, 'amount', e.target.value)}
                              className="input-modern text-sm"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-primary-700 mb-1">
                              Account Number
                            </label>
                            <input
                              type="text"
                              placeholder="1234567890"
                              value={entry.accountNumber}
                              onChange={(e) => updateEntry(index, 'accountNumber', e.target.value)}
                              className="input-modern text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-primary-700 mb-1">
                              Transaction Ref
                            </label>
                            <input
                              type="text"
                              placeholder="UTR123456"
                              value={entry.transactionRef}
                              onChange={(e) => updateEntry(index, 'transactionRef', e.target.value)}
                              className="input-modern text-sm"
                            />
                          </div>
                        </div>

                        {manualEntries.length > 1 && (
                          <button
                            onClick={() => removeEntry(index)}
                            className="mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Error</p>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Reconciliation Results */
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Reconciliation Completed!</p>
                    <div className="mt-3 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-green-600">Successfully Matched</p>
                        <p className="text-2xl font-bold text-green-900">
                          {reconciliationResult?.success?.length || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-600">Failed to Match</p>
                        <p className="text-2xl font-bold text-amber-900">
                          {reconciliationResult?.failed?.length || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Not Found</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {reconciliationResult?.notFound?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Details */}
              {reconciliationResult?.success && reconciliationResult.success.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-green-700 mb-2">
                    ✓ Successfully Matched ({reconciliationResult.success.length})
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {reconciliationResult.success.map((item, index) => (
                      <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-semibold text-green-900">
                              {item.employee?.name || 'Unknown'} ({item.employeeCode})
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                              Disbursement ID: {item.disbursementId?.substring(0, 8)}...
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-900">
                              {formatCurrency(item.amount)}
                            </p>
                            {item.transactionRef && (
                              <p className="text-xs text-green-700 mt-1">
                                Ref: {item.transactionRef}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed Details */}
              {reconciliationResult?.failed && reconciliationResult.failed.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-amber-700 mb-2">
                    ⚠ Failed to Match ({reconciliationResult.failed.length})
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {reconciliationResult.failed.map((item, index) => (
                      <div key={index} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="text-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-amber-900">
                                {item.employeeCode}
                              </p>
                              <p className="text-xs text-amber-700 mt-1">
                                {item.reason || 'Unknown error'}
                              </p>
                            </div>
                            <p className="font-bold text-amber-900">
                              {formatCurrency(item.amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Not Found Details */}
              {reconciliationResult?.notFound && reconciliationResult.notFound.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    ✗ Not Found ({reconciliationResult.notFound.length})
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {reconciliationResult.notFound.map((item, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="text-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {item.employeeCode}
                              </p>
                              <p className="text-xs text-gray-700 mt-1">
                                No matching disbursement found
                              </p>
                            </div>
                            <p className="font-bold text-gray-900">
                              {formatCurrency(item.amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-primary-200 bg-primary-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-primary-700 hover:bg-primary-100 rounded-lg transition-colors"
            disabled={loading}
          >
            {success ? 'Close' : 'Cancel'}
          </button>
          {!success && (
            <button
              onClick={handleReconcile}
              disabled={loading}
              className="btn-modern bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Reconciling...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Reconcile Payments</span>
                </>
              )}
            </button>
          )}
          {success && (
            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="btn-modern btn-primary"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
