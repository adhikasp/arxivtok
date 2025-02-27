import { APIEvent } from "@solidjs/start/server";

/**
 * Health check endpoint for monitoring application status
 * Returns a 200 OK status when the application is running properly
 */
export async function GET(event: APIEvent) {
  return new Response(
    JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "arxivtok",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
} 