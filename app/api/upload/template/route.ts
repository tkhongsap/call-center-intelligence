import { NextResponse } from 'next/server';

export async function GET() {
  // Instructions row (commented with #)
  const instructions = [
    '# INSTRUCTIONS: Remove this row and the example rows below before uploading.',
    '# Required columns: caseNumber, createdAt, bu, channel',
    '# Optional columns: category, severity, summary, description',
    '# Date format: YYYY-MM-DD or ISO 8601 (e.g., 2024-01-15 or 2024-01-15T10:30:00Z)',
    '# Valid channels: phone, email, line, web',
    '# Valid severities: low, medium, high, critical',
    '# Valid business units: Retail, Corporate, SME, Government',
  ];

  // Create a CSV template with headers and example rows
  const headers = [
    'caseNumber',
    'createdAt',
    'bu',
    'channel',
    'category',
    'severity',
    'summary',
    'description',
  ];

  const exampleRows = [
    [
      'CASE-EXAMPLE-001',
      '2024-01-15',
      'Retail',
      'phone',
      'Billing',
      'medium',
      'Customer billing inquiry',
      'Customer called about incorrect charges on their account',
    ],
    [
      'CASE-EXAMPLE-002',
      '2024-01-15',
      'Corporate',
      'email',
      'Technical Support',
      'high',
      'System access issue',
      'User unable to log into the portal after password reset',
    ],
  ];

  const csvContent = [
    ...instructions,
    headers.join(','),
    ...exampleRows.map((row) =>
      row.map((cell) => (cell.includes(',') ? `"${cell}"` : cell)).join(',')
    ),
  ].join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="case-upload-template.csv"',
    },
  });
}
