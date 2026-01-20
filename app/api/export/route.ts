import { NextRequest, NextResponse } from 'next/server';
import {
  fetchCasesForExport,
  generateCSV,
  generateXLSX,
  MAX_EXPORT_ROWS,
  type ExportFilters,
} from '@/lib/export';

/**
 * GET /api/export
 * Export filtered cases to CSV or XLSX format
 *
 * Query parameters:
 * - format: 'csv' | 'xlsx' (default: 'csv')
 * - businessUnit: filter by business unit
 * - channel: filter by channel
 * - status: filter by status
 * - severity: filter by severity
 * - category: filter by category
 * - search: search in caseNumber, summary, customerName
 * - dateFrom: filter cases created on or after this date
 * - dateTo: filter cases created on or before this date
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get format (default to CSV)
    const format = searchParams.get('format') || 'csv';
    if (format !== 'csv' && format !== 'xlsx') {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: csv, xlsx' },
        { status: 400 }
      );
    }

    // Build filters from query params
    const filters: ExportFilters = {};

    const businessUnit = searchParams.get('businessUnit');
    if (businessUnit) filters.businessUnit = businessUnit;

    const channel = searchParams.get('channel');
    if (channel) filters.channel = channel;

    const status = searchParams.get('status');
    if (status) filters.status = status;

    const severity = searchParams.get('severity');
    if (severity) filters.severity = severity;

    const category = searchParams.get('category');
    if (category) filters.category = category;

    const search = searchParams.get('search');
    if (search) filters.search = search;

    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) filters.dateFrom = dateFrom;

    const dateTo = searchParams.get('dateTo');
    if (dateTo) filters.dateTo = dateTo;

    // Fetch filtered cases
    const cases = await fetchCasesForExport(filters);

    if (cases.length === 0) {
      return NextResponse.json(
        { error: 'No cases found matching the specified filters' },
        { status: 404 }
      );
    }

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `cases-export-${timestamp}`;

    if (format === 'csv') {
      const csvContent = generateCSV(cases);

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
          'X-Total-Rows': String(cases.length),
          'X-Max-Rows': String(MAX_EXPORT_ROWS),
        },
      });
    } else {
      // XLSX format
      const xlsxBuffer = await generateXLSX(cases);

      return new NextResponse(new Uint8Array(xlsxBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
          'X-Total-Rows': String(cases.length),
          'X-Max-Rows': String(MAX_EXPORT_ROWS),
        },
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}
