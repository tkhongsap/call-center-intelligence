// ═══════════════════════════════════════════════════════════════════════════════
// CSV Parser for Case Upload
// Handles CSV parsing, header detection, column mapping, and data validation
// ═══════════════════════════════════════════════════════════════════════════════

export interface ParsedRow {
  caseNumber: string;
  createdAt: string;
  businessUnit: string;
  channel: string;
  category?: string;
  severity?: string;
  summary?: string;
  customerName?: string;
  sentiment?: string;
  status?: string;
}

export interface ValidationError {
  row: number;
  column: string;
  value: string;
  reason: string;
  suggestedFix: string;
}

export interface ParseResult {
  success: boolean;
  rows: ParsedRow[];
  errors: ValidationError[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  headers: string[];
  detectedMapping: Record<string, string>;
}

// Valid enum values for case fields
const VALID_CHANNELS = ['phone', 'email', 'line', 'web'] as const;
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
const VALID_SENTIMENTS = ['positive', 'neutral', 'negative'] as const;
const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
const VALID_BUSINESS_UNITS = ['Cards', 'Lending', 'Digital', 'Wealth', 'Insurance', 'Support'] as const;

// Column name aliases for flexible mapping
const COLUMN_ALIASES: Record<string, string[]> = {
  caseNumber: ['case_number', 'casenumber', 'case number', 'case_no', 'case no', 'caseno', 'id', 'case_id'],
  createdAt: ['created_at', 'createdat', 'created at', 'date', 'timestamp', 'created', 'creation_date'],
  businessUnit: ['business_unit', 'businessunit', 'business unit', 'bu', 'department', 'unit'],
  channel: ['channel', 'source', 'contact_channel', 'contact channel'],
  category: ['category', 'type', 'issue_type', 'issue type', 'topic'],
  severity: ['severity', 'priority', 'level', 'urgency'],
  summary: ['summary', 'description', 'details', 'issue', 'problem', 'title', 'subject'],
  customerName: ['customer_name', 'customername', 'customer name', 'customer', 'name', 'client'],
  sentiment: ['sentiment', 'mood', 'emotion', 'customer_sentiment'],
  status: ['status', 'state', 'case_status'],
};

// String length limits
const MAX_CASE_NUMBER_LENGTH = 50;
const MAX_SUMMARY_LENGTH = 500;
const MAX_CUSTOMER_NAME_LENGTH = 100;
const MAX_CATEGORY_LENGTH = 100;

/**
 * Parse a CSV string into rows and columns
 * Handles quoted fields, escaped quotes, and various line endings
 */
export function parseCSVString(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  // Normalize line endings and handle BOM
  const text = csvText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(cell => cell !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Handle last field and row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(cell => cell !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Detect and map CSV headers to case fields
 */
export function detectColumnMapping(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const index = normalizedHeaders.indexOf(alias);
      if (index !== -1 && !(field in mapping)) {
        mapping[field] = index;
        break;
      }
    }
  }

  return mapping;
}

/**
 * Validate a date string and return ISO format
 */
function validateAndFormatDate(value: string): { valid: boolean; formatted?: string; error?: string } {
  if (!value) {
    return { valid: false, error: 'Date is required' };
  }

  // Try various date formats
  const formats = [
    // ISO format
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/,
    // Common formats: MM/DD/YYYY, DD/MM/YYYY, YYYY/MM/DD
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    /^\d{4}\/\d{1,2}\/\d{1,2}$/,
    // Dash formats
    /^\d{1,2}-\d{1,2}-\d{4}$/,
    /^\d{4}-\d{1,2}-\d{1,2}$/,
  ];

  const matchesFormat = formats.some(f => f.test(value));
  if (!matchesFormat) {
    return {
      valid: false,
      error: 'Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY'
    };
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date value' };
  }

  // Check for reasonable date range (not too old, not in future)
  const now = new Date();
  const minDate = new Date('2020-01-01');
  const maxDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow

  if (date < minDate) {
    return { valid: false, error: 'Date is too old. Must be after 2020-01-01' };
  }
  if (date > maxDate) {
    return { valid: false, error: 'Date cannot be in the future' };
  }

  return { valid: true, formatted: date.toISOString() };
}

/**
 * Validate enum value with case-insensitive matching
 */
function validateEnum<T extends string>(
  value: string,
  validValues: readonly T[],
  fieldName: string
): { valid: boolean; normalized?: T; error?: string; suggestion?: string } {
  if (!value) {
    return { valid: true }; // Optional field
  }

  const normalized = value.toLowerCase().trim();
  const match = validValues.find(v => v.toLowerCase() === normalized);

  if (match) {
    return { valid: true, normalized: match };
  }

  // Find closest match for suggestion
  const suggestions = validValues.filter(v =>
    v.toLowerCase().includes(normalized) || normalized.includes(v.toLowerCase())
  );

  return {
    valid: false,
    error: `Invalid ${fieldName}. Must be one of: ${validValues.join(', ')}`,
    suggestion: suggestions.length > 0
      ? `Did you mean '${suggestions[0]}'?`
      : `Valid values: ${validValues.join(', ')}`
  };
}

/**
 * Validate a single row of data
 */
function validateRow(
  rowData: Record<string, string>,
  rowNumber: number
): { valid: boolean; row?: ParsedRow; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Required field: caseNumber
  if (!rowData.caseNumber?.trim()) {
    errors.push({
      row: rowNumber,
      column: 'caseNumber',
      value: rowData.caseNumber || '',
      reason: 'Case number is required',
      suggestedFix: 'Provide a unique case identifier'
    });
  } else if (rowData.caseNumber.length > MAX_CASE_NUMBER_LENGTH) {
    errors.push({
      row: rowNumber,
      column: 'caseNumber',
      value: rowData.caseNumber.substring(0, 20) + '...',
      reason: `Case number exceeds ${MAX_CASE_NUMBER_LENGTH} characters`,
      suggestedFix: 'Shorten the case number'
    });
  }

  // Required field: createdAt
  const dateValidation = validateAndFormatDate(rowData.createdAt);
  if (!dateValidation.valid) {
    errors.push({
      row: rowNumber,
      column: 'createdAt',
      value: rowData.createdAt || '',
      reason: dateValidation.error!,
      suggestedFix: 'Use format YYYY-MM-DD (e.g., 2024-01-15)'
    });
  }

  // Required field: businessUnit
  if (!rowData.businessUnit?.trim()) {
    errors.push({
      row: rowNumber,
      column: 'businessUnit',
      value: rowData.businessUnit || '',
      reason: 'Business unit is required',
      suggestedFix: `Use one of: ${VALID_BUSINESS_UNITS.join(', ')}`
    });
  } else {
    const buValidation = validateEnum(rowData.businessUnit, VALID_BUSINESS_UNITS, 'business unit');
    if (!buValidation.valid) {
      errors.push({
        row: rowNumber,
        column: 'businessUnit',
        value: rowData.businessUnit,
        reason: buValidation.error!,
        suggestedFix: buValidation.suggestion!
      });
    }
  }

  // Required field: channel
  if (!rowData.channel?.trim()) {
    errors.push({
      row: rowNumber,
      column: 'channel',
      value: rowData.channel || '',
      reason: 'Channel is required',
      suggestedFix: `Use one of: ${VALID_CHANNELS.join(', ')}`
    });
  } else {
    const channelValidation = validateEnum(rowData.channel, VALID_CHANNELS, 'channel');
    if (!channelValidation.valid) {
      errors.push({
        row: rowNumber,
        column: 'channel',
        value: rowData.channel,
        reason: channelValidation.error!,
        suggestedFix: channelValidation.suggestion!
      });
    }
  }

  // Optional field: severity
  if (rowData.severity) {
    const severityValidation = validateEnum(rowData.severity, VALID_SEVERITIES, 'severity');
    if (!severityValidation.valid) {
      errors.push({
        row: rowNumber,
        column: 'severity',
        value: rowData.severity,
        reason: severityValidation.error!,
        suggestedFix: severityValidation.suggestion!
      });
    }
  }

  // Optional field: sentiment
  if (rowData.sentiment) {
    const sentimentValidation = validateEnum(rowData.sentiment, VALID_SENTIMENTS, 'sentiment');
    if (!sentimentValidation.valid) {
      errors.push({
        row: rowNumber,
        column: 'sentiment',
        value: rowData.sentiment,
        reason: sentimentValidation.error!,
        suggestedFix: sentimentValidation.suggestion!
      });
    }
  }

  // Optional field: status
  if (rowData.status) {
    const statusValidation = validateEnum(rowData.status, VALID_STATUSES, 'status');
    if (!statusValidation.valid) {
      errors.push({
        row: rowNumber,
        column: 'status',
        value: rowData.status,
        reason: statusValidation.error!,
        suggestedFix: statusValidation.suggestion!
      });
    }
  }

  // Optional field: summary (length check)
  if (rowData.summary && rowData.summary.length > MAX_SUMMARY_LENGTH) {
    errors.push({
      row: rowNumber,
      column: 'summary',
      value: rowData.summary.substring(0, 20) + '...',
      reason: `Summary exceeds ${MAX_SUMMARY_LENGTH} characters`,
      suggestedFix: 'Shorten the summary text'
    });
  }

  // Optional field: customerName (length check)
  if (rowData.customerName && rowData.customerName.length > MAX_CUSTOMER_NAME_LENGTH) {
    errors.push({
      row: rowNumber,
      column: 'customerName',
      value: rowData.customerName.substring(0, 20) + '...',
      reason: `Customer name exceeds ${MAX_CUSTOMER_NAME_LENGTH} characters`,
      suggestedFix: 'Shorten the customer name'
    });
  }

  // Optional field: category (length check)
  if (rowData.category && rowData.category.length > MAX_CATEGORY_LENGTH) {
    errors.push({
      row: rowNumber,
      column: 'category',
      value: rowData.category.substring(0, 20) + '...',
      reason: `Category exceeds ${MAX_CATEGORY_LENGTH} characters`,
      suggestedFix: 'Shorten the category name'
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Build the valid row
  const parsedRow: ParsedRow = {
    caseNumber: rowData.caseNumber.trim(),
    createdAt: dateValidation.formatted!,
    businessUnit: rowData.businessUnit.trim(),
    channel: rowData.channel.toLowerCase().trim() as typeof VALID_CHANNELS[number],
    category: rowData.category?.trim(),
    severity: rowData.severity?.toLowerCase().trim() as typeof VALID_SEVERITIES[number] | undefined,
    summary: rowData.summary?.trim(),
    customerName: rowData.customerName?.trim(),
    sentiment: rowData.sentiment?.toLowerCase().trim() as typeof VALID_SENTIMENTS[number] | undefined,
    status: rowData.status?.toLowerCase().trim() as typeof VALID_STATUSES[number] | undefined,
  };

  return { valid: true, row: parsedRow, errors: [] };
}

/**
 * Parse and validate a CSV file for case upload
 */
export function parseCSV(csvText: string): ParseResult {
  const allRows = parseCSVString(csvText);

  if (allRows.length === 0) {
    return {
      success: false,
      rows: [],
      errors: [{
        row: 0,
        column: '',
        value: '',
        reason: 'CSV file is empty',
        suggestedFix: 'Upload a CSV file with headers and data rows'
      }],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      headers: [],
      detectedMapping: {}
    };
  }

  const headers = allRows[0];
  const columnMapping = detectColumnMapping(headers);

  // Check required columns
  const requiredColumns = ['caseNumber', 'createdAt', 'businessUnit', 'channel'];
  const missingRequired = requiredColumns.filter(col => !(col in columnMapping));

  if (missingRequired.length > 0) {
    return {
      success: false,
      rows: [],
      errors: missingRequired.map(col => ({
        row: 1,
        column: col,
        value: '',
        reason: `Required column '${col}' not found in headers`,
        suggestedFix: `Add a column with one of these names: ${COLUMN_ALIASES[col].join(', ')}`
      })),
      totalRows: allRows.length - 1,
      validRows: 0,
      invalidRows: allRows.length - 1,
      headers,
      detectedMapping: Object.fromEntries(
        Object.entries(columnMapping).map(([field, index]) => [field, headers[index]])
      )
    };
  }

  const dataRows = allRows.slice(1);
  const validRows: ParsedRow[] = [];
  const allErrors: ValidationError[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNumber = i + 2; // 1-indexed, accounting for header row

    // Skip completely empty rows
    if (row.every(cell => !cell.trim())) {
      continue;
    }

    // Extract row data based on column mapping
    const rowData: Record<string, string> = {};
    for (const [field, index] of Object.entries(columnMapping)) {
      rowData[field] = row[index] || '';
    }

    const validation = validateRow(rowData, rowNumber);

    if (validation.valid && validation.row) {
      validRows.push(validation.row);
    }

    allErrors.push(...validation.errors);
  }

  return {
    success: allErrors.length === 0,
    rows: validRows,
    errors: allErrors,
    totalRows: dataRows.length,
    validRows: validRows.length,
    invalidRows: dataRows.length - validRows.length,
    headers,
    detectedMapping: Object.fromEntries(
      Object.entries(columnMapping).map(([field, index]) => [field, headers[index]])
    )
  };
}

/**
 * Get a preview of CSV data (first N rows)
 */
export function getCSVPreview(csvText: string, maxRows: number = 5): {
  headers: string[];
  rows: string[][];
  totalRows: number;
  detectedMapping: Record<string, string>;
} {
  const allRows = parseCSVString(csvText);

  if (allRows.length === 0) {
    return { headers: [], rows: [], totalRows: 0, detectedMapping: {} };
  }

  const headers = allRows[0];
  const columnMapping = detectColumnMapping(headers);
  const dataRows = allRows.slice(1, maxRows + 1);

  return {
    headers,
    rows: dataRows,
    totalRows: allRows.length - 1,
    detectedMapping: Object.fromEntries(
      Object.entries(columnMapping).map(([field, index]) => [field, headers[index]])
    )
  };
}

/**
 * Generate a CSV template string for case upload
 */
export function generateCSVTemplate(): string {
  const headers = [
    'case_number',
    'created_at',
    'business_unit',
    'channel',
    'category',
    'severity',
    'summary',
    'customer_name',
    'sentiment',
    'status'
  ];

  const exampleRow = [
    'CASE-001',
    '2024-01-15',
    'Cards',
    'phone',
    'Billing Issue',
    'medium',
    'Customer inquiry about monthly statement',
    'John Doe',
    'neutral',
    'open'
  ];

  return [
    headers.join(','),
    exampleRow.join(',')
  ].join('\n');
}

// Export constants for use in other modules
export const CSV_VALID_CHANNELS = VALID_CHANNELS;
export const CSV_VALID_SEVERITIES = VALID_SEVERITIES;
export const CSV_VALID_SENTIMENTS = VALID_SENTIMENTS;
export const CSV_VALID_STATUSES = VALID_STATUSES;
export const CSV_VALID_BUSINESS_UNITS = VALID_BUSINESS_UNITS;
