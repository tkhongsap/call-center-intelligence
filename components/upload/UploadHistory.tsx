"use client";

import {
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useLocale } from "next-intl";
import type { Upload } from "@/lib/types";

interface UploadHistoryProps {
  uploads?: Upload[];
}

const statusConfig = {
  processing: {
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    label: "Processing",
  },
  completed: {
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-50",
    label: "Completed",
  },
  failed: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-50",
    label: "Failed",
  },
  partial: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    label: "Partial",
  },
};

function formatDate(dateString: string, locale: string = "en"): string {
  const localeCode = locale === "th" ? "th-TH" : "en-US";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(localeCode, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadHistory({ uploads }: UploadHistoryProps) {
  const locale = useLocale();

  if (!uploads || uploads.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-sm">No upload history yet</p>
        <p className="text-xs mt-1">Upload a CSV file to see it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {uploads.map((upload) => {
        const status = statusConfig[upload.status];
        const StatusIcon = status.icon;

        return (
          <div
            key={upload.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors gap-3"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`p-2 rounded-lg ${status.bgColor} flex-shrink-0`}>
                <StatusIcon className={`w-5 h-5 ${status.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {upload.fileName}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(upload.createdAt, locale)}
                  <span className="hidden sm:inline">
                    {" "}
                    • {formatFileSize(upload.fileSize)}
                  </span>
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right flex items-center sm:block gap-2 pl-11 sm:pl-0">
              <span className={`text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
              <p className="text-xs text-slate-500 sm:mt-0.5">
                {upload.successCount}/{upload.totalRows} rows
                {upload.errorCount > 0 && (
                  <span className="text-red-500 ml-1">
                    ({upload.errorCount} err)
                  </span>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
