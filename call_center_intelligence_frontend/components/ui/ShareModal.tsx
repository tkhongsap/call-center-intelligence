'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Send, Users, AlertTriangle } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (recipientId: string, message: string) => Promise<void>;
  title: string;
  type: 'share' | 'escalate';
}

// Mock user directory
const users = [
  { id: 'user-1', name: 'Sarah Johnson', role: 'BU Manager', department: 'Credit Cards' },
  { id: 'user-2', name: 'Michael Chen', role: 'Supervisor', department: 'Mobile Banking' },
  { id: 'user-3', name: 'Emily Davis', role: 'BU Manager', department: 'Online Banking' },
  { id: 'user-4', name: 'James Wilson', role: 'Admin', department: 'Operations' },
  { id: 'user-5', name: 'Lisa Brown', role: 'Supervisor', department: 'Personal Loans' },
];

export function ShareModal({ isOpen, onClose, onShare, title, type }: ShareModalProps) {
  const [selectedUser, setSelectedUser] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations('share');
  const tCommon = useTranslations('common');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await onShare(selectedUser, message);
      setSelectedUser('');
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEscalate = type === 'escalate';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal - responsive width with mobile margins */}
      <div className="relative bg-white rounded-xl shadow-xl w-[calc(100%-2rem)] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-slate-200 ${isEscalate ? 'bg-amber-50' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEscalate ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <Users className="w-5 h-5 text-blue-600" />
              )}
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {isEscalate && (
            <p className="text-sm text-amber-700 mt-2">
              This will mark the case as escalated and notify the recipient immediately.
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Recipient selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('selectRecipients')}
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
              className="w-full h-11 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('selectRecipients')}...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.role} ({user.department})
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('addMessage')}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('messagePlaceholder')}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 px-4 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              disabled={!selectedUser || isSubmitting}
              className={`flex-1 h-11 px-4 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isEscalate
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? tCommon('loading') : t('shareButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
