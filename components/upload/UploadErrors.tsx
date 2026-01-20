'use client';

import { useState } from 'react';
import { AlertTriangle, Download, ChevronDown, ChevronUp, X, Info } from 'lucide-react';
import type { ValidationError } from '@/lib/csvParser';

interface UploadErrorsProps {
  errors: ValidationError[];
  totalRows: number;
  validRows: number;
  onDismiss?: () => void;
  showDownload?: boolean;
}

type ErrorSeverity = 'critical' | 'warning' | 'info';

// Determine error severity based on the column and error type
function getErrorSeverity(error: ValidationError): ErrorSeverity {
  // Critical errors - required fields or data corruption
  const criticalColumns = ['caseNumber', 'createdAt', 'businessUnit', 'channel'];
  if (criticalColumns.includes(error.column)) {
    return 'critical';
  }

  // Warning - invalid enum values or format issues
  if (error.reason.includes('Invalid') || error.reason.includes('format')) {
    return 'warning';
  }

  // Info - length limits and other minor issues
  return 'info';
}

function getSeverityStyles(severity: ErrorSeverity): {
  row: string;
  badge: string;
  text: string;
} {
  switch (severity) {
    case 'critical':
      return {
        row: 'bg-red-50 border-l-4 border-l-red-500',
        badge: 'bg-red-100 text-red-800',
        text: 'text-red-700',
      };
    case 'warning':
      return {
        row: 'bg-amber-50 border-l-4 border-l-amber-500',
        badge: 'bg-amber-100 text-amber-800',
        text: 'text-amber-700',
      };
    case 'info':
    default:
      return {
        row: 'bg-blue-50 border-l-4 border-l-blue-400',
        badge: 'bg-blue-100 text-blue-800',
        text: 'text-blue-700',
      };
  }
}

function getSeverityIcon(severity: ErrorSeverity) {
  switch (severity) {
    case 'critical':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'info':
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
}

function generateErrorReport(errors: ValidationError[], totalRows: number, validRows: number): string {
  const lines: string[] = [
    'Upload Validation Error Report',
    '=' .repeat(50),
    '',
    `Total Rows: ${totalRows}`,
    `Valid Rows: ${validRows}`,
    `Invalid Rows: ${totalRows - validRows}`,
    `Total Errors: ${errors.length}`,
    '',
    '=' .repeat(50),
    'Error Details',
    '=' .repeat(50),
    '',
    'Row,Column,Value,Error,Suggested Fix',
  ];

  errors.forEach((error) => {
    // Escape CSV values
    const escapeCSV = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    lines.push(
      [
        error.row.toString(),
        escapeCSV(error.column),
        escapeCSV(error.value),
        escapeCSV(error.reason),
        escapeCSV(error.suggestedFix),
      ].join(',')
    );
  });

  return lines.join('\n');
}

function downloadErrorReport(errors: ValidationError[], totalRows: number, validRows: number) {
  const report = generateErrorReport(errors, totalRows, validRows);
  const blob = new Blob([report], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `upload-errors-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function UploadErrors({
  errors,
  totalRows,
  validRows,
  onDismiss,
  showDownload = true,
}: UploadErrorsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);

  if (errors.length === 0) {
    return null;
  }

  // Group errors by severity for summary
  const errorsBySeverity = errors.reduce(
    (acc, error) => {
      const severity = getErrorSeverity(error);
      acc[severity]++;
      return acc;
    },
    { critical: 0, warning: 0, info: 0 } as Record<ErrorSeverity, number>
  );

  const invalidRows = totalRows - validRows;
  const visibleErrors = errors.slice(0, visibleCount);
  const hasMoreErrors = errors.length > visibleCount;

  return (
    <div className="border border-red-200 rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-red-50 px-4 py-3 border-b border-red-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-900">
                Validation Errors Found
              </h3>
              <p className="text-xs text-red-700">
                {errors.length} error{errors.length !== 1 ? 's' : ''} in {invalidRows} row{invalidRows !== 1 ? 's' : ''} • {validRows} of {totalRows} rows valid
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showDownload && (
              <button
                onClick={() => downloadErrorReport(errors, totalRows, validRows)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                title="Download error report"
              >
                <Download className="w-3.5 h-3.5" />
                Download Report
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Severity Summary */}
        {isExpanded && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-red-200">
            {errorsBySeverity.critical > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="text-xs text-red-700">
                  {errorsBySeverity.critical} critical
                </span>
              </div>
            )}
            {errorsBySeverity.warning > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                <span className="text-xs text-amber-700">
                  {errorsBySeverity.warning} warning{errorsBySeverity.warning !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {errorsBySeverity.info > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span className="text-xs text-blue-700">
                  {errorsBySeverity.info} info
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Table */}
      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">
                  Row
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">
                  Column
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Error Reason
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Suggested Fix
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleErrors.map((error, index) => {
                const severity = getErrorSeverity(error);
                const styles = getSeverityStyles(severity);

                return (
                  <tr key={index} className={styles.row}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(severity)}
                        <span className="font-mono text-sm font-medium text-slate-900">
                          {error.row}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${styles.badge}`}>
                        {error.column}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className={`text-sm ${styles.text}`}>{error.reason}</p>
                        {error.value && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Value: <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-700">{error.value.length > 50 ? error.value.substring(0, 50) + '...' : error.value}</code>
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-600">{error.suggestedFix}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Show More Button */}
          {hasMoreErrors && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-center">
              <button
                onClick={() => setVisibleCount(prev => prev + 10)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Show {Math.min(10, errors.length - visibleCount)} more errors ({errors.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
