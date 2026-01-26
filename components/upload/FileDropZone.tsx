'use client';

import { useCallback, useState } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
}

export function FileDropZone({
  onFileSelect,
  accept = '.csv',
  maxSize = 10 * 1024 * 1024 // 10MB default
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return 'Only CSV files are accepted';
    }
    if (file.size > maxSize) {
      return `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`;
    }
    return null;
  }, [maxSize]);

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-colors cursor-pointer
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50'
          }
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="text-center">
          <Upload className={`w-10 h-10 mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
          <p className="text-sm text-slate-600 mb-1">
            <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-500">
            CSV files only, max {Math.round(maxSize / (1024 * 1024))}MB
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selectedFile && !error && (
        <div className="flex items-center justify-between bg-slate-100 p-3 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
