import { NextRequest } from "next/server";

/**
 * SSE (Server-Sent Events) endpoint for real-time feed updates
 *
 * Pushes events:
 * - new_feed_items: New items added to the feed
 * - alert_count: Updated alert count
 * - heartbeat: Keep-alive ping every 30 seconds
 *
 * Query params:
 * - lastEventId: ISO timestamp to get events after (optional)
 */

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const POLL_INTERVAL = 5000; // 5 seconds - internal poll for new events

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lastEventIdParam = searchParams.get("lastEventId");

  // Track last seen event timestamp
  let lastEventTime = lastEventIdParam
    ? new Date(lastEventIdParam)
    : new Date();

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Helper to send SSE event
      const sendEvent = (event: string, data: unknown) => {
        const id = new Date().toISOString();
        const message = `id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Helper to send heartbeat
      const sendHeartbeat = () => {
        sendEvent("heartbeat", { timestamp: new Date().toISOString() });
      };

      // Check for new feed items and alert count via backend
      const checkForUpdates = async () => {
        try {
          const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

          // Get new feed items since last check
          const feedResponse = await fetch(
            `${backendUrl}/api/events/feed?since=${lastEventTime.toISOString()}`,
          );

          if (feedResponse.ok) {
            const feedData = await feedResponse.json();
            if (feedData.items && feedData.items.length > 0) {
              // Update last event time to newest item
              lastEventTime = new Date(feedData.items[0].createdAt);
              sendEvent("new_feed_items", { items: feedData.items });
            }
          }

          // Get active alert count
          const alertResponse = await fetch(`${backendUrl}/api/alerts/count`);
          if (alertResponse.ok) {
            const alertData = await alertResponse.json();
            sendEvent("alert_count", {
              count: alertData.count ?? 0,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error("[SSE] Error checking for updates:", error);
          sendEvent("error", { message: "Failed to check for updates" });
        }
      };

      // Send initial data
      await checkForUpdates();

      // Set up polling interval
      const pollInterval = setInterval(checkForUpdates, POLL_INTERVAL);

      // Set up heartbeat interval
      const heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(pollInterval);
        clearInterval(heartbeatInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
