import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Call the backend API for alerts count
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/api/alerts/count`);

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching alerts count:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts count" },
      { status: 500 },
    );
  }
}
