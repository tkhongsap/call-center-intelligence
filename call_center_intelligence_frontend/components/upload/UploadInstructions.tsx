'use client';

import { FileSpreadsheet, Download } from 'lucide-react';

export function UploadInstructions() {
  const handleDownloadTemplate = async () => {
    const response = await fetch('/api/upload/template');
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'case-upload-template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FileSpreadsheet className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-slate-900 mb-2">CSV Format Requirements</h3>
          <ul className="text-sm text-slate-600 space-y-1.5">
            <li>
              <span className="font-medium text-slate-700">Required columns:</span>{' '}
              caseNumber, createdAt, bu, channel
            </li>
            <li>
              <span className="font-medium text-slate-700">Optional columns:</span>{' '}
              category, severity, summary, description
            </li>
            <li>
              <span className="font-medium text-slate-700">Date format:</span>{' '}
              YYYY-MM-DD or ISO 8601
            </li>
            <li>
              <span className="font-medium text-slate-700">Valid channels:</span>{' '}
              phone, email, line, web
            </li>
            <li>
              <span className="font-medium text-slate-700">Valid severities:</span>{' '}
              low, medium, high, critical
            </li>
          </ul>

          <button
            onClick={handleDownloadTemplate}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Download className="w-4 h-4" />
            Download CSV Template
          </button>
        </div>
      </div>
    </div>
  );
}
