import React, { useState } from 'react';
import { 
  Plus, Phone, Mail, Calendar, FileText,
  ArrowDownCircle, ArrowUpCircle, Clock
} from 'lucide-react';
import { crmAPI } from '../../api/crm.api';

const QuickLogCommunication = ({ 
  customerId, 
  contactId, 
  leadId, 
  dealId,
  onSuccess,
  buttonText = "Log Communication",
  buttonClass = "btn-modern btn-secondary btn-sm"
}) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    type: 'PHONE',
    direction: 'OUTBOUND',
    subject: '',
    notes: '',
    duration: 0,
    outcome: ''
  });

  const resetForm = () => {
    setFormData({
      type: 'PHONE',
      direction: 'OUTBOUND',
      subject: '',
      notes: '',
      duration: 0,
      outcome: ''
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        type: formData.type,
        direction: formData.direction || undefined,
        subject: formData.subject || undefined,
        notes: formData.notes,
        occurredAt: new Date().toISOString(),
        duration: formData.duration ? Number(formData.duration) : undefined,
        outcome: formData.outcome || undefined,
        customerId: customerId || undefined,
        contactId: contactId || undefined,
        leadId: leadId || undefined,
        dealId: dealId || undefined
      };

      await crmAPI.createCommunication(payload);
      setShowModal(false);
      resetForm();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to save communication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={buttonClass}
      >
        <Plus className="w-4 h-4" />
        <span>{buttonText}</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-primary-200">
              <h3 className="text-lg font-semibold text-primary-900">Quick Log Communication</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Type *</label>
                  <select
                    className="input-modern text-sm"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="PHONE">Phone Call</option>
                    <option value="EMAIL">Email</option>
                    <option value="MEETING">Meeting</option>
                    <option value="NOTE">Note</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Direction</label>
                  <select
                    className="input-modern text-sm"
                    value={formData.direction}
                    onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                  >
                    <option value="">Not specified</option>
                    <option value="INBOUND">Inbound</option>
                    <option value="OUTBOUND">Outbound</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Subject</label>
                <input
                  className="input-modern text-sm"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief summary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Notes *</label>
                <textarea
                  className="input-modern text-sm"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="What was discussed?"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Duration (min)</label>
                  <input
                    className="input-modern text-sm"
                    type="number"
                    min="0"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Outcome</label>
                  <select
                    className="input-modern text-sm"
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                  >
                    <option value="">Not specified</option>
                    <option value="SUCCESSFUL">Successful</option>
                    <option value="NO_ANSWER">No Answer</option>
                    <option value="LEFT_MESSAGE">Left Message</option>
                    <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  className="btn-modern btn-secondary"
                  onClick={() => { setShowModal(false); resetForm(); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modern btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickLogCommunication;
