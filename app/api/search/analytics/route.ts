import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/search/analytics - Get popular searches
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "10";
    const days = searchParams.get("days") || "30";

    // Forward request to the backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const backendResponse = await fetch(
      `${backendUrl}/api/search/analytics?limit=${limit}&days=${days}`,
    );

    if (!backendResponse.ok) {
      throw new Error(`Backend API error: ${backendResponse.status}`);
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching search analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch search analytics" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/search/analytics - Log a search query
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward request to the backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const backendResponse = await fetch(`${backendUrl}/api/search/analytics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend API error: ${backendResponse.status}`);
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error logging search analytics:", error);
    // Don't fail the response - analytics logging shouldn't break the user experience
    return NextResponse.json({ success: true, logged: false });
  }
}
