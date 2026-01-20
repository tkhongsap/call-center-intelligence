'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Share2, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { ShareModal } from '@/components/ui/ShareModal';
import { cn } from '@/lib/utils';

export type FeedItemType = 'alert' | 'trending' | 'highlight' | 'upload';

interface FeedCardActionsProps {
  itemType: FeedItemType;
  itemId: string;
  referenceId?: string;
  viewCasesUrl: string;
  viewCasesLabel?: string;
  showShare?: boolean;
  showEscalate?: boolean;
  onShare?: (recipientId: string, message: string, type: 'share' | 'escalation') => Promise<void>;
  className?: string;
}

type ActionState = 'idle' | 'loading' | 'success' | 'error';

export function FeedCardActions({
  itemType,
  itemId,
  referenceId,
  viewCasesUrl,
  viewCasesLabel = 'View cases',
  showShare = true,
  showEscalate = true,
  onShare,
  className,
}: FeedCardActionsProps) {
  const router = useRouter();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareType, setShareType] = useState<'share' | 'escalate'>('share');
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleViewCases = () => {
    router.push(viewCasesUrl);
  };

  const handleOpenShare = (type: 'share' | 'escalate') => {
    setShareType(type);
    setShareModalOpen(true);
  };

  const handleShare = async (recipientId: string, message: string) => {
    setActionState('loading');
    try {
      if (onShare) {
        await onShare(recipientId, message, shareType === 'escalate' ? 'escalation' : 'share');
      } else {
        // Default share/escalation API call
        // Note: Using mock current user ID. In production, this would come from auth context
        const currentUserId = 'user-4'; // James Wilson - Admin

        const response = await fetch('/api/shares', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: shareType === 'escalate' ? 'escalation' : 'share',
            sourceType: itemType === 'alert' ? 'alert' : 'case',
            sourceId: referenceId || itemId,
            senderId: currentUserId,
            recipientId,
            message,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to share');
        }
      }

      setActionState('success');
      setFeedbackMessage(shareType === 'escalate' ? 'Escalated successfully' : 'Shared successfully');

      // Clear feedback after 3 seconds
      setTimeout(() => {
        setActionState('idle');
        setFeedbackMessage(null);
      }, 3000);
    } catch (error) {
      setActionState('error');
      setFeedbackMessage('Failed to share. Please try again.');

      // Clear error after 3 seconds
      setTimeout(() => {
        setActionState('idle');
        setFeedbackMessage(null);
      }, 3000);
    }
  };

  return (
    <>
      <div className={cn(
        'px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between',
        className
      )}>
        {/* View cases button */}
        <button
          onClick={handleViewCases}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
        >
          <Eye className="w-4 h-4" />
          {viewCasesLabel}
        </button>

        {/* Action feedback or action buttons */}
        <div className="flex items-center gap-2">
          {feedbackMessage ? (
            <span className={cn(
              'text-sm font-medium flex items-center gap-1',
              actionState === 'success' ? 'text-green-600' : 'text-red-600'
            )}>
              {actionState === 'success' && <Check className="w-4 h-4" />}
              {feedbackMessage}
            </span>
          ) : (
            <>
              {showShare && (
                <button
                  onClick={() => handleOpenShare('share')}
                  disabled={actionState === 'loading'}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {actionState === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                  Share
                </button>
              )}
              {showEscalate && (
                <button
                  onClick={() => handleOpenShare('escalate')}
                  disabled={actionState === 'loading'}
                  className="px-3 py-1.5 text-sm font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {actionState === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  Escalate
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onShare={handleShare}
        title={shareType === 'escalate' ? 'Escalate Item' : 'Share Item'}
        type={shareType}
      />
    </>
  );
}
