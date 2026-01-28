import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Forward request to the backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const backendResponse = await fetch(`${backendUrl}/api/pulse/wordcloud`);

    if (!backendResponse.ok) {
      throw new Error(`Backend API error: ${backendResponse.status}`);
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching wordcloud:", error);
    return NextResponse.json(
      { error: "Failed to fetch wordcloud" },
      { status: 500 },
    );
  }
}
