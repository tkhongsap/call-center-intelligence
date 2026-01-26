import { db } from './db';
import { cases } from './db/schema';
import { and, eq, like, gte, lte, or, SQL, desc } from 'drizzle-orm';
import type { Case } from './db/schema';

// Maximum rows allowed in export
export const MAX_EXPORT_ROWS = 10000;

// Case filters for export query
export interface ExportFilters {
  businessUnit?: string;
  channel?: string;
  status?: string;
  severity?: string;
  category?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Column configuration for export
interface ExportColumn {
  key: keyof Case;
  header: string;
  format?: (value: unknown) => string;
}

// Export columns with headers and formatters
const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'caseNumber', header: 'Case Number' },
  { key: 'createdAt', header: 'Created At', format: formatDate },
  { key: 'businessUnit', header: 'Business Unit' },
  { key: 'channel', header: 'Channel', format: capitalize },
  { key: 'status', header: 'Status', format: formatStatus },
  { key: 'category', header: 'Category' },
  { key: 'subcategory', header: 'Subcategory' },
  { key: 'severity', header: 'Severity', format: capitalize },
  { key: 'sentiment', header: 'Sentiment', format: capitalize },
  { key: 'summary', header: 'Summary' },
  { key: 'customerName', header: 'Customer Name' },
  { key: 'agentId', header: 'Agent ID' },
  { key: 'assignedTo', header: 'Assigned To' },
  { key: 'riskFlag', header: 'Risk Flag', format: formatBoolean },
  { key: 'needsReviewFlag', header: 'Needs Review', format: formatBoolean },
  { key: 'resolvedAt', header: 'Resolved At', format: formatDate },
  { key: 'updatedAt', header: 'Updated At', format: formatDate },
];

// Format helpers
function formatDate(value: unknown): string {
  if (!value) return '';
  try {
    return new Date(String(value)).toISOString().split('T')[0];
  } catch {
    return String(value);
  }
}

function formatBoolean(value: unknown): string {
  return value ? 'Yes' : 'No';
}

function capitalize(value: unknown): string {
  if (!value) return '';
  const str = String(value);
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatStatus(value: unknown): string {
  if (!value) return '';
  const str = String(value);
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Build filter conditions from export filters
function buildFilterConditions(filters: ExportFilters): SQL[] {
  const conditions: SQL[] = [];

  if (filters.businessUnit) {
    conditions.push(eq(cases.businessUnit, filters.businessUnit));
  }

  if (filters.channel) {
    conditions.push(eq(cases.channel, filters.channel as 'phone' | 'email' | 'line' | 'web'));
  }

  if (filters.status) {
    conditions.push(eq(cases.status, filters.status as 'open' | 'in_progress' | 'resolved' | 'closed'));
  }

  if (filters.severity) {
    conditions.push(eq(cases.severity, filters.severity as 'low' | 'medium' | 'high' | 'critical'));
  }

  if (filters.category) {
    conditions.push(eq(cases.category, filters.category));
  }

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(cases.caseNumber, searchTerm),
        like(cases.summary, searchTerm),
        like(cases.customerName, searchTerm)
      )!
    );
  }

  if (filters.dateFrom) {
    conditions.push(gte(cases.createdAt, filters.dateFrom));
  }

  if (filters.dateTo) {
    conditions.push(lte(cases.createdAt, filters.dateTo));
  }

  return conditions;
}

// Fetch cases with filters for export
export async function fetchCasesForExport(filters: ExportFilters): Promise<Case[]> {
  const conditions = buildFilterConditions(filters);

  const query = db
    .select()
    .from(cases)
    .orderBy(desc(cases.createdAt))
    .limit(MAX_EXPORT_ROWS);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }

  return query;
}

// Escape CSV field (handle commas, quotes, newlines)
function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

// Generate CSV content from cases
export function generateCSV(data: Case[]): string {
  // Header row
  const headers = EXPORT_COLUMNS.map(col => col.header);
  const headerRow = headers.map(escapeCSVField).join(',');

  // Data rows
  const dataRows = data.map(row => {
    return EXPORT_COLUMNS.map(col => {
      const value = row[col.key];
      const formatted = col.format ? col.format(value) : value;
      return escapeCSVField(formatted);
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

// Generate XLSX workbook data for xlsx library
export function generateXLSXData(data: Case[]): {
  headers: string[];
  rows: (string | number | boolean | null)[][];
} {
  const headers = EXPORT_COLUMNS.map(col => col.header);

  const rows = data.map(row => {
    return EXPORT_COLUMNS.map(col => {
      const value = row[col.key];
      if (col.format) {
        return col.format(value);
      }
      if (value === null || value === undefined) {
        return null;
      }
      return value;
    });
  });

  return { headers, rows };
}

// Generate XLSX binary using the xlsx library (to be called from API route)
export async function generateXLSX(data: Case[]): Promise<Buffer> {
  // Dynamic import to avoid bundling on client
  const XLSX = await import('xlsx');

  const { headers, rows } = generateXLSXData(data);

  // Create worksheet with headers and data
  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths for better readability
  const columnWidths = EXPORT_COLUMNS.map(col => ({
    wch: Math.max(col.header.length, 15),
  }));
  worksheet['!cols'] = columnWidths;

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cases');

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return buffer;
}

// Get count of cases matching filters (for display purposes)
export async function getFilteredCaseCount(filters: ExportFilters): Promise<number> {
  const conditions = buildFilterConditions(filters);

  const query = db.select().from(cases);

  let result;
  if (conditions.length > 0) {
    result = await query.where(and(...conditions));
  } else {
    result = await query;
  }

  return result.length;
}
