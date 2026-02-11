import { useState } from 'react';
import payrollAPI from '../../../api/payrollAPI';
import { Download, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';

export default function PaymentFileGenerator({ selectedDisbursements, onClose, onSuccess }) {
  const [fileFormat, setFileFormat] = useState('CSV');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fileData, setFileData] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const totalAmount = selectedDisbursements.reduce((sum, d) => sum + d.amount, 0);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await payrollAPI.generatePaymentFile({
        disbursementIds: selectedDisbursements.map(d => d.id),
        fileFormat
      });

      setFileData(response.data);
      setSuccess(true);

      // Auto-download the file
      downloadFile(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate payment file');
      console.error('Payment file generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (data) => {
    const blob = new Blob([data.fileContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = data.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadAgain = () => {
    if (fileData) {
      downloadFile(fileData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-900">Generate Payment File</h2>
              <p className="text-sm text-primary-600">Export disbursements for bank processing</p>
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
          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-600 font-medium">Selected Disbursements</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {selectedDisbursements.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Amount</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Disbursements List */}
          <div>
            <p className="text-sm font-medium text-primary-700 mb-2">Selected Employees:</p>
            <div className="max-h-48 overflow-y-auto space-y-2 bg-primary-50 rounded-lg p-3">
              {selectedDisbursements.map((d, index) => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <span className="text-primary-900">
                    {index + 1}. {d.employee?.name || 'Unknown'} ({d.employee?.employeeCode || 'N/A'})
                  </span>
                  <span className="font-semibold text-primary-900">
                    {formatCurrency(d.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* File Format Selection */}
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-2">
              Select File Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFileFormat('CSV')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  fileFormat === 'CSV'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-primary-200 hover:border-primary-300'
                }`}
              >
                <FileText className={`w-6 h-6 mx-auto mb-2 ${
                  fileFormat === 'CSV' ? 'text-blue-600' : 'text-primary-400'
                }`} />
                <p className={`font-semibold ${
                  fileFormat === 'CSV' ? 'text-blue-900' : 'text-primary-700'
                }`}>
                  CSV Format
                </p>
                <p className="text-xs text-primary-600 mt-1">
                  Standard comma-separated format for Excel/Google Sheets
                </p>
              </button>

              <button
                onClick={() => setFileFormat('NEFT')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  fileFormat === 'NEFT'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-primary-200 hover:border-primary-300'
                }`}
              >
                <FileText className={`w-6 h-6 mx-auto mb-2 ${
                  fileFormat === 'NEFT' ? 'text-blue-600' : 'text-primary-400'
                }`} />
                <p className={`font-semibold ${
                  fileFormat === 'NEFT' ? 'text-blue-900' : 'text-primary-700'
                }`}>
                  NEFT Format
                </p>
                <p className="text-xs text-primary-600 mt-1">
                  Fixed-width format for bank NEFT transfers
                </p>
              </button>
            </div>
          </div>

          {/* Format Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">Important Information</p>
                <ul className="text-xs text-amber-800 mt-2 space-y-1 ml-4 list-disc">
                  {fileFormat === 'CSV' ? (
                    <>
                      <li>CSV file includes employee details, bank account, and amount</li>
                      <li>Can be imported into Excel or uploaded to online banking portals</li>
                      <li>Verify all bank details before processing payments</li>
                    </>
                  ) : (
                    <>
                      <li>NEFT format follows standard banking fixed-width structure</li>
                      <li>Contains Header (H), Detail (D), and Trailer (T) records</li>
                      <li>Compatible with most Indian bank NEFT upload systems</li>
                    </>
                  )}
                  <li className="font-semibold">Disbursements will be marked as "PROCESSING" after file generation</li>
                </ul>
              </div>
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

          {/* Success Message */}
          {success && fileData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">Payment File Generated Successfully!</p>
                  <div className="mt-3 space-y-1 text-sm text-green-800">
                    <p><span className="font-semibold">Filename:</span> {fileData.filename}</p>
                    <p><span className="font-semibold">Records:</span> {fileData.recordCount}</p>
                    <p><span className="font-semibold">Total Amount:</span> {formatCurrency(fileData.totalAmount)}</p>
                  </div>
                  <button
                    onClick={handleDownloadAgain}
                    className="mt-3 text-sm text-green-700 hover:text-green-900 font-medium underline"
                  >
                    Download Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-primary-200 bg-primary-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-primary-700 hover:bg-primary-100 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          {!success ? (
            <button
              onClick={handleGenerate}
              disabled={loading || selectedDisbursements.length === 0}
              className="btn-modern btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate & Download</span>
                </>
              )}
            </button>
          ) : (
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
