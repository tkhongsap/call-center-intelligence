'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/upload/FileUpload';
import { CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface UploadResult {
  success: boolean;
  message: string;
  uploadId?: string;
  successCount?: number;
  errorCount?: number;
  recomputeStatus?: 'pending' | 'processing' | 'completed' | 'failed' | null;
}

interface RecomputeStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  alertsGenerated?: number;
  trendingUpdated?: boolean;
}

export function UploadSection() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [recomputeStatus, setRecomputeStatus] = useState<RecomputeStatus | null>(null);
  const [isRecomputing, setIsRecomputing] = useState(false);

  // Trigger recomputation after successful upload
  const triggerRecomputation = useCallback(async (uploadId: string) => {
    setIsRecomputing(true);
    setRecomputeStatus({ status: 'processing' });

    try {
      const response = await fetch(`/api/uploads/${uploadId}/recompute`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setRecomputeStatus({
          status: data.status,
          alertsGenerated: data.alertsGenerated,
          trendingUpdated: data.trendingUpdated,
        });
      } else {
        setRecomputeStatus({ status: 'failed' });
      }
    } catch {
      setRecomputeStatus({ status: 'failed' });
    } finally {
      setIsRecomputing(false);
    }
  }, []);

  // Auto-trigger recomputation when upload succeeds
  useEffect(() => {
    if (result?.success && result?.uploadId && result?.recomputeStatus === 'pending') {
      triggerRecomputation(result.uploadId);
    }
  }, [result, triggerRecomputation]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setResult(null);
    setRecomputeStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `Successfully uploaded ${data.successCount || 0} cases`,
          uploadId: data.uploadId,
          successCount: data.successCount,
          errorCount: data.errorCount,
          recomputeStatus: data.recomputeStatus,
        });
        // Refresh the page to show new upload in history
        router.refresh();
      } else {
        setResult({
          success: false,
          message: data.error || 'Upload failed',
          errorCount: data.errorCount,
        });
      }
    } catch {
      setResult({
        success: false,
        message: 'Network error. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setResult(null);
    setRecomputeStatus(null);
  };

  return (
    <div className="space-y-4">
      {result && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg ${
            result.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.message}
            </p>
            {result.errorCount !== undefined && result.errorCount > 0 && (
              <p className="text-xs text-slate-600 mt-1">
                {result.errorCount} row{result.errorCount > 1 ? 's' : ''} had errors
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recomputation Status */}
      {recomputeStatus && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg ${
            recomputeStatus.status === 'processing'
              ? 'bg-blue-50 border border-blue-200'
              : recomputeStatus.status === 'completed'
                ? 'bg-emerald-50 border border-emerald-200'
                : recomputeStatus.status === 'failed'
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-slate-50 border border-slate-200'
          }`}
        >
          {recomputeStatus.status === 'processing' ? (
            <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
          ) : recomputeStatus.status === 'completed' ? (
            <RefreshCw className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p
              className={`text-sm font-medium ${
                recomputeStatus.status === 'processing'
                  ? 'text-blue-800'
                  : recomputeStatus.status === 'completed'
                    ? 'text-emerald-800'
                    : 'text-amber-800'
              }`}
            >
              {recomputeStatus.status === 'processing'
                ? 'Processing alerts and trends...'
                : recomputeStatus.status === 'completed'
                  ? 'Analysis complete'
                  : 'Analysis failed'}
            </p>
            {recomputeStatus.status === 'completed' && (
              <p className="text-xs text-slate-600 mt-1">
                {recomputeStatus.alertsGenerated || 0} alert{recomputeStatus.alertsGenerated !== 1 ? 's' : ''} generated
                {recomputeStatus.trendingUpdated && ' • Trending topics updated'}
              </p>
            )}
            {recomputeStatus.status === 'failed' && (
              <p className="text-xs text-amber-700 mt-1">
                Could not recompute alerts and trends. They will update on the next scheduled run.
              </p>
            )}
          </div>
        </div>
      )}

      <FileUpload
        onUpload={handleUpload}
        onCancel={handleCancel}
        isUploading={isUploading || isRecomputing}
      />
    </div>
  );
}
