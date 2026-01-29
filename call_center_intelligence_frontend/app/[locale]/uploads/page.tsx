import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/Header';
import { UploadSection } from './UploadSection';
import { UploadHistory } from '@/components/upload/UploadHistory';
import { UploadInstructions } from '@/components/upload/UploadInstructions';
import type { Upload } from '@/lib/types';

interface UploadsResponse {
  uploads: Upload[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function getUploads(): Promise<UploadsResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const response = await fetch(`${apiUrl}/api/uploads?limit=10`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return { uploads: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  }

  return response.json();
}

function UploadHistoryLoading() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg">
          <div className="w-10 h-10 bg-slate-200 rounded-lg" />
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function UploadHistoryContent() {
  const data = await getUploads();
  return <UploadHistory uploads={data.uploads} />;
}

export default async function UploadsPage() {
  const t = await getTranslations('pages.uploads');

  return (
    <>
      <Header title={t('title')} />
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Page Description */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{t('uploadFile')}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {t('supportedFormats')}
            </p>
          </div>

          {/* Upload Instructions */}
          <UploadInstructions />

          {/* File Upload Section */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="font-medium text-slate-900 mb-4">{t('uploadFile')}</h3>
            <UploadSection />
          </div>

          {/* Upload History */}
          <div>
            <h3 className="font-medium text-slate-900 mb-4">{t('uploadHistory')}</h3>
            <Suspense fallback={<UploadHistoryLoading />}>
              <UploadHistoryContent />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
