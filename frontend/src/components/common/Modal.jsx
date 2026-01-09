import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md', 
  type = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = ''
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  const typeConfig = {
    default: {
      icon: null,
      headerBg: 'bg-white',
      headerText: 'text-primary-900',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600'
    },
    success: {
      icon: CheckCircle,
      headerBg: 'bg-emerald-50',
      headerText: 'text-emerald-900',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    },
    warning: {
      icon: AlertTriangle,
      headerBg: 'bg-amber-50',
      headerText: 'text-amber-900',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600'
    },
    error: {
      icon: AlertCircle,
      headerBg: 'bg-red-50',
      headerText: 'text-red-900',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    info: {
      icon: Info,
      headerBg: 'bg-blue-50',
      headerText: 'text-blue-900',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      modalRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      previousFocusRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleOverlayClick}
      >
        {/* Modal Container */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            ref={modalRef}
            tabIndex={-1}
            className={`relative w-full ${sizeClasses[size]} transform overflow-hidden modern-card-elevated ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className={`px-6 py-4 border-b border-primary-200 ${config.headerBg}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {Icon && (
                      <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${config.iconColor}`} />
                      </div>
                    )}
                    {title && (
                      <h3 className={`text-lg font-semibold ${config.headerText}`}>
                        {title}
                      </h3>
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                      aria-label="Close modal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="px-6 py-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Confirmation Modal Component
export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  loading = false
}) => {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type={type} size="sm">
      <div className="space-y-4">
        <p className="text-primary-600">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-modern btn-secondary disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`btn-modern disabled:opacity-50 ${
              type === 'error' 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'btn-primary'
            }`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Alert Modal Component
export const AlertModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info',
  buttonText = 'OK'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type={type} size="sm">
      <div className="space-y-4">
        <p className="text-primary-600">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="btn-modern btn-primary"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Modal;