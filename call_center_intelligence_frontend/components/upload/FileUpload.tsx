'use client';

import { useState, useCallback } from 'react';
import { FileDropZone } from './FileDropZone';
import { FileText, X, Check, Loader2, AlertCircle, Table } from 'lucide-react';

interface ParsedPreview {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  onCancel?: () => void;
  isUploading?: boolean;
}

function parseCSVPreview(content: string, maxRows: number = 5): ParsedPreview {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  // Simple CSV parsing (handles basic cases, not complex quoted values)
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const dataLines = lines.slice(1);
  const rows = dataLines.slice(0, maxRows).map(parseLine);

  return {
    headers,
    rows,
    totalRows: dataLines.length,
  };
}

export function FileUpload({ onUpload, onCancel, isUploading = false }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setParseError(null);
    setPreview(null);

    try {
      const text = await file.text();
      const parsed = parseCSVPreview(text, 5);

      if (parsed.headers.length === 0) {
        setParseError('The file appears to be empty');
        return;
      }

      setPreview(parsed);
    } catch {
      setParseError('Failed to read file contents');
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    await onUpload(selectedFile);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setParseError(null);
    onCancel?.();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // No file selected - show drop zone
  if (!selectedFile) {
    return <FileDropZone onFileSelect={handleFileSelect} />;
  }

  return (
    <div className="space-y-4">
      {/* Selected File Info */}
      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
            <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
          </div>
        </div>
        {!isUploading && (
          <button
            onClick={handleCancel}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Parse Error */}
      {parseError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Preview Section */}
      {preview && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {/* Preview Header */}
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">File Preview</span>
              </div>
              <span className="text-xs text-slate-500">
                Showing {Math.min(5, preview.rows.length)} of {preview.totalRows} rows
              </span>
            </div>
          </div>

          {/* Detected Columns */}
          <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Detected Columns ({preview.headers.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {preview.headers.map((header, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium bg-white border border-slate-200 rounded text-slate-700"
                >
                  {header || `Column ${idx + 1}`}
                </span>
              ))}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200 w-12">
                    #
                  </th>
                  {preview.headers.map((header, idx) => (
                    <th
                      key={idx}
                      className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200 whitespace-nowrap"
                    >
                      {header || `Col ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-xs text-slate-400 font-mono">
                      {rowIdx + 1}
                    </td>
                    {preview.headers.map((_, colIdx) => (
                      <td
                        key={colIdx}
                        className="px-3 py-2 text-slate-600 max-w-xs truncate"
                        title={row[colIdx] || ''}
                      >
                        {row[colIdx] || <span className="text-slate-300">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.totalRows > 5 && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-center">
              <span className="text-xs text-slate-500">
                ... and {preview.totalRows - 5} more rows
              </span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={handleCancel}
          disabled={isUploading}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={isUploading || !!parseError || !preview}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Upload
            </>
          )}
        </button>
      </div>
    </div>
  );
}
