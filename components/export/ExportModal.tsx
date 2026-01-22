'use client';

import { useState } from 'react';
import { X, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

export type ExportFormat = 'csv' | 'xlsx';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => Promise<void>;
  totalCount: number;
  hasFilters: boolean;
}

export function ExportModal({ isOpen, onClose, onExport, totalCount, hasFilters }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(selectedFormat);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const maxExportRows = 10000;
  const willBeTruncated = totalCount > maxExportRows;

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
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Export Cases</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Export info */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              {hasFilters ? (
                <>Exporting <span className="font-medium text-slate-900">{totalCount.toLocaleString()}</span> filtered cases</>
              ) : (
                <>Exporting <span className="font-medium text-slate-900">{totalCount.toLocaleString()}</span> cases</>
              )}
            </p>
            {willBeTruncated && (
              <p className="text-sm text-amber-600 mt-2">
                Export limited to {maxExportRows.toLocaleString()} rows. Apply filters to reduce the dataset.
              </p>
            )}
          </div>

          {/* Format selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Select Format
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={selectedFormat === 'csv'}
                  onChange={() => setSelectedFormat('csv')}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <FileText className="w-5 h-5 text-green-600 ml-3 mr-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">CSV</p>
                  <p className="text-xs text-slate-500">Comma-separated values, works with Excel and most tools</p>
                </div>
              </label>
              <label className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="xlsx"
                  checked={selectedFormat === 'xlsx'}
                  onChange={() => setSelectedFormat('xlsx')}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <FileSpreadsheet className="w-5 h-5 text-blue-600 ml-3 mr-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Excel (XLSX)</p>
                  <p className="text-xs text-slate-500">Native Excel format with formatting support</p>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 px-4 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
