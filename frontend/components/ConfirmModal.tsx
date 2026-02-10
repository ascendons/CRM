"use client";

import { useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmButtonClass?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmButtonClass,
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
  children,
}: ConfirmModalProps) {
  // ... (keep existing getButtonClass, getIconClass, getIconName, useEffect as is, implied in context or unmodified if not targeted)

  /* Note: Since I cannot easily skip lines in replacement without showing them, and I want to minimize context, I will target specific blocks. */
  /* Better to do 2 separate edits: one for interface, one for component signature and rendering. */
  /* Let's try to target the interface first. */
  // Determine button class based on variant if confirmButtonClass is not provided
  const getButtonClass = () => {
    if (confirmButtonClass) return confirmButtonClass;
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500';
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  };

  const getIconClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-100 text-red-600';
      case 'warning':
        return 'bg-amber-100 text-amber-600';
      case 'primary':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  const getIconName = () => {
    switch (variant) {
      case 'danger':
        return 'warning';
      case 'warning':
        return 'error'; // warning icon
      case 'primary':
        return 'info';
      default:
        return 'info';
    }
  };
  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-6 py-5">
            {/* Icon */}
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${getIconClass()}`}>
                <span className="material-symbols-outlined">{getIconName()}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              </div>
            </div>

            {/* Message */}
            <div className="mt-4 ml-16">
              <p className="text-sm text-gray-600">{message}</p>
              {children && <div className="mt-4">{children}</div>}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${getButtonClass()}`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
