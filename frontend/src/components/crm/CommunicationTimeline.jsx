import React from 'react';
import { 
  Phone, Mail, Calendar, FileText, MessageSquare, MessageCircle,
  ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, XCircle
} from 'lucide-react';

const CommunicationTimeline = ({ communications = [], compact = false }) => {
  const getTypeIcon = (type) => {
    const icons = {
      PHONE: Phone,
      EMAIL: Mail,
      MEETING: Calendar,
      NOTE: FileText,
      SMS: MessageSquare,
      CHAT: MessageCircle
    };
    return icons[type] || MessageCircle;
  };

  const getTypeColor = (type) => {
    const colors = {
      PHONE: 'bg-blue-100 text-blue-700',
      EMAIL: 'bg-purple-100 text-purple-700',
      MEETING: 'bg-emerald-100 text-emerald-700',
      NOTE: 'bg-gray-100 text-gray-700',
      SMS: 'bg-orange-100 text-orange-700',
      CHAT: 'bg-pink-100 text-pink-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getOutcomeBadge = (outcome) => {
    if (!outcome) return null;
    const config = {
      SUCCESSFUL: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
      NO_ANSWER: { color: 'bg-yellow-100 text-yellow-700', icon: XCircle },
      LEFT_MESSAGE: { color: 'bg-blue-100 text-blue-700', icon: MessageSquare },
      FOLLOW_UP_REQUIRED: { color: 'bg-orange-100 text-orange-700', icon: Clock }
    };
    return config[outcome] || { color: 'bg-gray-100 text-gray-700', icon: MessageCircle };
  };

  const formatDuration = (minutes) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!communications || communications.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600">No communications recorded</p>
      </div>
    );
  }

  // Sort by date descending
  const sortedComms = [...communications].sort((a, b) => 
    new Date(b.occurredAt || b.createdAt) - new Date(a.occurredAt || a.createdAt)
  );

  return (
    <div className="relative">
      {!compact && <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-primary-200"></div>}
      <div className={compact ? 'space-y-3' : 'space-y-4'}>
        {sortedComms.map((comm, index) => {
          const TypeIcon = getTypeIcon(comm.type);
          const outcomeBadge = getOutcomeBadge(comm.outcome);
          const OutcomeIcon = outcomeBadge?.icon;

          return (
            <div key={comm.id || index} className={compact ? 'p-3 bg-gray-50 rounded-lg' : 'relative pl-11'}>
              {!compact && (
                <div className={`absolute left-1.5 top-1.5 w-5 h-5 rounded-full flex items-center justify-center border-4 border-white ${getTypeColor(comm.type)}`}>
                  <TypeIcon className="w-2.5 h-2.5" />
                </div>
              )}
              
              <div className={compact ? '' : 'bg-white border border-primary-100 rounded-lg p-3'}>
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(comm.type)}`}>
                      {compact && <TypeIcon className="w-3 h-3" />}
                      <span>{comm.type}</span>
                    </span>
                    {comm.direction && (
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        comm.direction === 'INBOUND' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {comm.direction === 'INBOUND' ? <ArrowDownCircle className="w-3 h-3" /> : <ArrowUpCircle className="w-3 h-3" />}
                        <span className="hidden sm:inline">{comm.direction}</span>
                      </span>
                    )}
                    {comm.outcome && OutcomeIcon && (
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${outcomeBadge.color}`}>
                        <OutcomeIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">{comm.outcome.replace('_', ' ')}</span>
                      </span>
                    )}
                    {comm.duration > 0 && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(comm.duration)}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-primary-500 whitespace-nowrap ml-2">
                    {formatDate(comm.occurredAt || comm.createdAt)}
                  </span>
                </div>

                {/* Content */}
                {comm.subject && (
                  <h5 className="text-sm font-semibold text-primary-900 mb-1">
                    {comm.subject}
                  </h5>
                )}
                {comm.notes && (
                  <p className={`text-sm text-primary-600 ${compact ? 'line-clamp-2' : ''}`}>
                    {comm.notes}
                  </p>
                )}

                {/* Related entities */}
                {!compact && (comm.customer || comm.contact || comm.lead || comm.deal) && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {comm.customer && (
                      <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded">
                        Customer: {comm.customer.name}
                      </span>
                    )}
                    {comm.contact && (
                      <span className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded">
                        Contact: {comm.contact.name}
                      </span>
                    )}
                    {comm.lead && (
                      <span className="inline-flex items-center px-2 py-1 bg-orange-50 text-orange-700 rounded">
                        Lead: {comm.lead.name}
                      </span>
                    )}
                    {comm.deal && (
                      <span className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-700 rounded">
                        Deal: {comm.deal.name}
                      </span>
                    )}
                  </div>
                )}

                {/* Type-specific details */}
                {!compact && comm.type === 'EMAIL' && (comm.emailFrom || comm.emailTo) && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-primary-600 space-y-1">
                    {comm.emailFrom && <div>From: {comm.emailFrom}</div>}
                    {comm.emailTo && <div>To: {comm.emailTo}</div>}
                    {comm.emailCc && <div>Cc: {comm.emailCc}</div>}
                  </div>
                )}
                {!compact && comm.type === 'MEETING' && (comm.meetingLocation || comm.meetingAttendees?.length > 0) && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-primary-600 space-y-1">
                    {comm.meetingLocation && <div>Location: {comm.meetingLocation}</div>}
                    {comm.meetingAttendees?.length > 0 && (
                      <div>Attendees: {comm.meetingAttendees.join(', ')}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommunicationTimeline;
