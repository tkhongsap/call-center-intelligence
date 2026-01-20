import { NextRequest, NextResponse } from 'next/server';
import { searchCases, type SearchOptions } from '@/lib/search';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const sortBy = searchParams.get('sortBy') as SearchOptions['sortBy'] || 'relevance';
  const sortOrder = searchParams.get('sortOrder') as SearchOptions['sortOrder'] || 'desc';

  if (!query.trim()) {
    return NextResponse.json({
      results: [],
      totalCount: 0,
      parsedQuery: {
        keywords: [],
        timeRange: null,
        businessUnits: [],
        channels: [],
        severities: [],
        categories: [],
        flags: { urgent: false, risk: false, needsReview: false },
        originalQuery: '',
      },
      suggestedFilters: [],
      executionTimeMs: 0,
    });
  }

  try {
    const offset = (page - 1) * limit;
    const response = await searchCases(query, {
      limit,
      offset,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
